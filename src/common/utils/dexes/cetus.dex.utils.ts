import { normalizeStructTag } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { BaseDexUtils, IDexUtils } from 'common/utils/dexes/base.dex.utils';
import { SUI_ADDRESS, SUI_TOKEN_ADDRESS_SHORT } from 'common/constants/address';
import { TCoinMetadata } from 'common/types/coin.type';
import { SUI_TOKEN_METADATA } from 'common/constants/common';
import { suiClient, SuiClientUtils } from 'common/utils/onchain/sui-client';
import raidenxConfig from 'config/raidenx.config';
import { TSwapParams } from 'common/types/dex.type';

const { dexes } = raidenxConfig();

interface IBuyParams {
  walletAddress: string;
  exactAmountIn: BigNumber | string | number;
  minAmountOut: BigNumber | string | number;
  gasBasePrice: bigint;
  poolObjectId: string;
  tokenIn?: TCoinMetadata;
  orderId?: string;
}

interface ISellParams {
  walletAddress: string;
  exactAmountIn: BigNumber | string | number;
  minAmountOut: BigNumber | string | number;
  tokenIn: TCoinMetadata;
  gasBasePrice: bigint;
  coinObjs: (CoinStruct & { owner: string })[];
  poolObjectId: string;
  orderId?: string;
}

export class CetusDexUtils extends BaseDexUtils implements IDexUtils {
  async buildSimulateBuyParams(params: TSwapParams): Promise<IBuyParams> {
    const exactAmountIn = new BigNumber(params.amountIn).multipliedBy(10 ** params.tokenIn.decimals);
    return {
      walletAddress: params.walletAddress,
      exactAmountIn: exactAmountIn,
      minAmountOut: 0,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      poolObjectId: params.poolId,
      tokenIn: params.tokenIn,
    };
  }

  async buildSimulateSellParams(params: TSwapParams): Promise<ISellParams> {
    const exactAmountIn = new BigNumber(params.amountIn).multipliedBy(10 ** params.tokenIn.decimals);
    const [coinObjs] = await SuiClientUtils.getOwnerCoinOnchain(params.walletAddress, params.tokenIn.address);

    return {
      walletAddress: params.walletAddress,
      exactAmountIn: exactAmountIn,
      minAmountOut: 0,
      tokenIn: params.tokenIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      coinObjs,
      poolObjectId: params.poolId,
    };
  }

  async buildBuyParams(params: TSwapParams): Promise<IBuyParams> {
    const simulateParams = await this.buildSimulateBuyParams(params);
    const simulateTx = await this.buildBuyTransaction(simulateParams);
    const simulateResponse = await suiClient.dryRunTransactionBlock({
      transactionBlock: await simulateTx.build({
        client: suiClient,
      }),
    });

    const { amountOut } = SuiClientUtils.extractTokenAmount(simulateResponse);

    const minAmountOut = new BigNumber(amountOut)
      .multipliedBy(1 - params.slippage / 100)
      .integerValue(BigNumber.ROUND_FLOOR);

    return {
      walletAddress: params.walletAddress,
      exactAmountIn: simulateParams.exactAmountIn,
      minAmountOut: minAmountOut,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      poolObjectId: params.poolId,
      tokenIn: params.tokenIn,
    };
  }

  async buildSellParams(params: TSwapParams): Promise<ISellParams> {
    const simulateParams = await this.buildSimulateSellParams(params);
    const simulateTx = await this.buildSellTransaction(simulateParams);

    console.log('========= simulateTx =========');
    console.log(simulateTx);

    return {
      walletAddress: params.walletAddress,
      exactAmountIn: simulateParams.exactAmountIn,
      minAmountOut: 0,
      tokenIn: params.tokenIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      coinObjs: simulateParams.coinObjs,
      poolObjectId: params.poolId,
    };
  }

  async buildBuyTransaction(params: IBuyParams): Promise<Transaction> {
    const {
      walletAddress,
      exactAmountIn,
      minAmountOut,
      gasBasePrice,
      poolObjectId,
      tokenIn = SUI_TOKEN_METADATA,
      orderId = 'abc',
    } = params;
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);

    let coinTokenIn = null;

    if (tokenIn.address === SUI_TOKEN_ADDRESS_SHORT || tokenIn.address === SUI_ADDRESS) {
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(exactAmountIn.toString())]);
      coinTokenIn = coin;
    } else {
      const [tokenInObjects] = await SuiClientUtils.getOwnerCoinOnchain(walletAddress, tokenIn.address);
      if (tokenInObjects.length > 1) {
        tx.mergeCoins(
          tokenInObjects[0].coinObjectId,
          tokenInObjects.slice(1).map((coin) => coin.coinObjectId),
        );
      }
      coinTokenIn = tx.object(tokenInObjects[0].coinObjectId);
    }

    const { data: poolObject } = await SuiClientUtils.getSuiObject({
      id: poolObjectId,
      options: {
        showContent: true,
      },
    });
    const poolType = (poolObject?.content as any)?.type;
    const { tokenXAddress, tokenYAddress } = this.extractTokenX2YFromPoolType(poolType);
    if (!tokenXAddress || !tokenYAddress) {
      throw new Error('Invalid pool type');
    }
    const xToY = tokenXAddress && normalizeStructTag(tokenXAddress) === normalizeStructTag(tokenIn.address);

    let tokenXObject = null;
    let tokenYObject = null;

    if (normalizeStructTag(tokenXAddress) === normalizeStructTag(tokenIn.address)) {
      tokenXObject = coinTokenIn;
      tokenYObject = tx.moveCall({
        target: '0x2::coin::zero',
        typeArguments: [tokenYAddress],
      });
    } else {
      tokenXObject = tx.moveCall({
        target: '0x2::coin::zero',
        typeArguments: [tokenXAddress],
      });
      tokenYObject = coinTokenIn;
    }
    tx.moveCall({
      target: `${dexes.cetus.package}::${dexes.cetus.module}::buy_exact_in`,
      typeArguments: [tokenXAddress, tokenYAddress],
      arguments: [
        tx.object(dexes.cetus.feeObjectId),
        tx.object(dexes.cetus.configObjectId),
        tx.object(poolObjectId),
        tokenXObject,
        tokenYObject,
        tx.pure.u64(exactAmountIn.toString()),
        tx.pure.u64(minAmountOut.toString()),
        tx.pure.u128(xToY ? BigInt('4295048016') : BigInt('79226673515401279992447579055')),
        tx.object('0x6'),
        tx.pure.bool(xToY ? true : false), // buy = false, sell = true
        tx.pure.string(orderId),
      ],
    });

    return tx;
  }

  async buildSellTransaction(params: ISellParams): Promise<Transaction> {
    const {
      walletAddress,
      exactAmountIn,
      minAmountOut,
      tokenIn,
      gasBasePrice,
      coinObjs,
      poolObjectId,
      orderId = 'abc',
    } = params;
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);

    if (coinObjs.length > 1) {
      tx.mergeCoins(
        coinObjs[0].coinObjectId,
        coinObjs.slice(1).map((coin) => coin.coinObjectId),
      );
    }

    const { data: poolObject } = await SuiClientUtils.getSuiObject({
      id: poolObjectId,
      options: {
        showContent: true,
      },
    });
    const poolType = (poolObject?.content as any)?.type;
    const { tokenXAddress, tokenYAddress } = this.extractTokenX2YFromPoolType(poolType);
    if (!tokenXAddress || !tokenYAddress) {
      throw new Error('Invalid pool type');
    }
    const xToY = tokenXAddress && normalizeStructTag(tokenXAddress) === normalizeStructTag(tokenIn.address);

    let tokenXObject = null;
    let tokenYObject = null;

    if (normalizeStructTag(tokenXAddress) === normalizeStructTag(tokenIn.address)) {
      tokenXObject = tx.object(coinObjs[0].coinObjectId);
      tokenYObject = tx.moveCall({
        target: '0x2::coin::zero',
        typeArguments: [tokenYAddress],
      });
    } else {
      tokenXObject = tx.moveCall({
        target: '0x2::coin::zero',
        typeArguments: [tokenXAddress],
      });
      tokenYObject = tx.object(coinObjs[0].coinObjectId);
    }

    tx.moveCall({
      target: `${dexes.cetus.package}::${dexes.cetus.module}::sell_exact_in`, // package
      typeArguments: [tokenXAddress, tokenYAddress],
      arguments: [
        tx.object(dexes.cetus.feeObjectId), // feeObject
        tx.object(dexes.cetus.configObjectId), // dex config cetus
        tx.object(poolObjectId), // pool address
        tx.object(
          poolObjectId, // pool address
        ),
        tokenXObject,
        tokenYObject,
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(minAmountOut.toString()), // amountOutMin
        tx.pure.u128(xToY ? BigInt('4295048016') : BigInt('79226673515401279992447579055')), // hardcode
        tx.object('0x6'), // clock
        tx.pure.bool(xToY ? true : false), // buy = false, sell = true
        tx.pure.string(orderId), // orderId
      ],
    });
    return tx;
  }
}
