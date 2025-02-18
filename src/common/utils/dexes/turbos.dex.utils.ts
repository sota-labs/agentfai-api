import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { TCoinMetadata } from 'common/types/coin.type';
import { BaseDexUtils, IDexUtils } from 'common/utils/dexes/base.dex.utils';
import raidenxConfig from 'config/raidenx.config';
import { SUI_TOKEN_ADDRESS_SHORT } from 'common/constants/address';
import { TSwapParams } from 'common/types/dex.type';
import { suiClient, SuiClientUtils } from 'common/utils/onchain/sui-client';

const { dexes } = raidenxConfig();

interface IBuyParams {
  walletAddress: string;
  exactAmountIn: BigNumber | string | number;
  minAmountOut: BigNumber | string | number;
  tokenOut: TCoinMetadata;
  gasBasePrice: bigint;
  feeTierAddress: string;
  poolObjectId: string;
  orderId?: string;
}

interface ISellParams {
  walletAddress: string;
  exactAmountIn: BigNumber | string | number;
  minAmountOut: BigNumber | string | number;
  tokenIn: TCoinMetadata;
  gasBasePrice: bigint;
  feeTierAddress: string;
  poolObjectId: string;
  coinObjs: (CoinStruct & { owner: string })[];
  orderId?: string;
}

export class TurbosDexUtils extends BaseDexUtils implements IDexUtils {
  async buildSimulateBuyParams(params: TSwapParams): Promise<IBuyParams> {
    const poolObject = await SuiClientUtils.getSuiObject({
      id: params.poolId,
      options: {
        showType: true,
      },
    });

    const feeTierAddress = this._getFeeTierAddressFromPooType(poolObject.data!.type!);

    const exactAmountIn = new BigNumber(params.amountIn)
      .multipliedBy(10 ** params.tokenIn.decimals)
      .integerValue(BigNumber.ROUND_FLOOR);

    return {
      walletAddress: params.walletAddress,
      exactAmountIn: exactAmountIn,
      minAmountOut: 0,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      poolObjectId: params.poolId,
      tokenOut: params.tokenOut,
      feeTierAddress,
    };
  }

  async buildSimulateSellParams(params: TSwapParams): Promise<ISellParams> {
    const exactAmountIn = new BigNumber(params.amountIn)
      .multipliedBy(10 ** params.tokenIn.decimals)
      .integerValue(BigNumber.ROUND_FLOOR);

    const [coinObjs] = await SuiClientUtils.getOwnerCoinOnchain(params.walletAddress, params.tokenIn.address);

    const poolObject = await SuiClientUtils.getSuiObject({
      id: params.poolId,
      options: {
        showType: true,
      },
    });

    const feeTierAddress = this._getFeeTierAddressFromPooType(poolObject.data!.type!);

    return {
      walletAddress: params.walletAddress,
      exactAmountIn: exactAmountIn,
      minAmountOut: 0,
      tokenIn: params.tokenIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      coinObjs,
      poolObjectId: params.poolId,
      feeTierAddress,
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
      ...simulateParams,
      minAmountOut: minAmountOut,
      orderId: params.orderId,
    };
  }

  async buildSellParams(params: TSwapParams): Promise<ISellParams> {
    const simulateParams = await this.buildSimulateSellParams(params);
    const simulateTx = await this.buildSellTransaction(simulateParams);
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
      ...simulateParams,
      minAmountOut,
      orderId: params.orderId,
    };
  }

  async buildBuyTransaction(params: IBuyParams) {
    const {
      walletAddress,
      exactAmountIn,
      tokenOut,
      gasBasePrice,
      feeTierAddress,
      poolObjectId,
      orderId = 'abc',
    } = params;
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);

    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(exactAmountIn.toString())]);

    tx.moveCall({
      target: `${dexes.turbos.package}::${dexes.turbos.module}::buy_exact_in`, // package
      typeArguments: [
        tokenOut.address, // tokenAddress
        SUI_TOKEN_ADDRESS_SHORT,
        feeTierAddress,
      ],
      arguments: [
        tx.object(
          dexes.turbos.feeObjectId, // feeObject
        ),
        tx.object(poolObjectId),
        tx.moveCall({
          target: `0x2::coin::zero`,
          typeArguments: [tokenOut.address],
        }),
        coin,
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(0), // amountOutMin
        tx.pure.u128('79226673515401279992447579055'),
        tx.pure.u64(Date.now().toString() + 5 * 60 * 1000),
        tx.object('0x6'),
        tx.object(dexes.turbos.configObjectId),
        tx.pure.bool(false),
        tx.pure.string(orderId),
      ],
    });

    return tx;
  }

  async buildSellTransaction(params: ISellParams) {
    const {
      walletAddress,
      exactAmountIn,
      tokenIn,
      gasBasePrice,
      feeTierAddress,
      poolObjectId,
      coinObjs,
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

    tx.moveCall({
      target: `${dexes.turbos.package}::${dexes.turbos.module}::sell_exact_in`, // package
      typeArguments: [
        tokenIn.address, // tokenAddress
        SUI_TOKEN_ADDRESS_SHORT,
        feeTierAddress,
      ],
      arguments: [
        tx.object(
          dexes.turbos.feeObjectId, // feeObject
        ),
        tx.object(poolObjectId),
        tx.object(coinObjs[0].coinObjectId), // tokenInObject
        tx.moveCall({
          target: `0x2::coin::zero`,
          typeArguments: [SUI_TOKEN_ADDRESS_SHORT],
        }),
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(0), // amountOutMin
        tx.pure.u128('4295048016'),
        tx.pure.u64(Date.now().toString() + 5 * 60 * 1000),
        tx.object('0x6'),
        tx.object(dexes.turbos.configObjectId),
        tx.pure.bool(true),
        tx.pure.string(orderId),
      ],
    });

    return tx;
  }

  private _getFeeTierAddressFromPooType(poolType: string) {
    return poolType.split(',')[2].trim().slice(0, -1);
  }
}
