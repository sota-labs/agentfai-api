import { Transaction } from '@mysten/sui/transactions';
import BigNumber from 'bignumber.js';
import { BaseDexUtils, IDexUtils } from 'common/utils/dexes/base.dex.utils';
import { TCoinMetadata } from 'common/types/coin.type';
import raidenxConfig from 'config/raidenx.config';
import { TSwapParams } from 'common/types/dex.type';
import { suiClient, SuiClientUtils } from 'common/utils/onchain/sui-client';
import { NumericUtils } from 'common/utils/numeric.utils';
import { CoinStruct } from '@mysten/sui/dist/cjs/client';

const { dexes } = raidenxConfig();

interface IBuyParams {
  walletAddress: string;
  exactAmountIn: BigNumber | string | number;
  minAmountOut: BigNumber | string | number;
  gasBasePrice: bigint;
  poolObjectId: string;
  tokenIn?: TCoinMetadata;
  tokenOut: TCoinMetadata;
  orderId?: string;
}

interface ISellParams {
  walletAddress: string;
  exactAmountIn: BigNumber | string | number;
  minAmountOut: BigNumber | string | number;
  gasBasePrice: bigint;
  poolObjectId: string;
  tokenIn?: TCoinMetadata;
  tokenOut: TCoinMetadata;
  orderId?: string;
  coinObjs: (CoinStruct & { owner: string })[];
}

export class SevenkfunDexUtils extends BaseDexUtils implements IDexUtils {
  async buildSimulateBuyParams(params: TSwapParams): Promise<IBuyParams> {
    const exactAmountIn = NumericUtils.exactAmountIn(params.amountIn, params.tokenIn.decimals);

    return {
      walletAddress: params.walletAddress,
      exactAmountIn,
      minAmountOut: 0,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      poolObjectId: params.poolId,
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
    };
  }

  async buildSimulateSellParams(params: TSwapParams): Promise<ISellParams> {
    const exactAmountIn = NumericUtils.exactAmountIn(params.amountIn, params.tokenIn.decimals);
    const [coinObjs] = await SuiClientUtils.getOwnerCoinOnchain(params.walletAddress, params.tokenIn.address);

    return {
      walletAddress: params.walletAddress,
      exactAmountIn: exactAmountIn,
      minAmountOut: 0,
      tokenIn: params.tokenIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      poolObjectId: params.poolId,
      orderId: params.orderId,
      tokenOut: params.tokenOut,
      coinObjs,
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
      tokenOut: params.tokenOut,
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
      walletAddress: params.walletAddress,
      exactAmountIn: simulateParams.exactAmountIn,
      minAmountOut,
      tokenIn: params.tokenIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      poolObjectId: params.poolId,
      orderId: params.orderId,
      tokenOut: params.tokenOut,
      coinObjs: simulateParams.coinObjs,
    };
  }

  async buildBuyTransaction(params: IBuyParams) {
    const { walletAddress, exactAmountIn, tokenOut, gasBasePrice, minAmountOut, orderId = 'abc' } = params;
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);

    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(exactAmountIn.toString())]);
    tx.moveCall({
      target: `${dexes.sevenkfun.package}::${dexes.sevenkfun.module}::buy_exact_in`, // package
      typeArguments: [
        tokenOut.address, // tokenAddress
      ],
      arguments: [
        tx.object(dexes.sevenkfun.feeObjectId),
        tx.object(dexes.sevenkfun.configObjectId), // configObject,
        coin,
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(minAmountOut.toString()), // amountOutMin
        tx.object.clock(),
        tx.object(dexes.flowx.configObjectId), //container
        tx.pure.string(orderId), // orderId
        tx.object(dexes.sevenkfun.aggregatorConfigObjectId),
        tx.object(dexes.sevenkfun.aggregatorVaultObject!),
      ],
    });

    return tx;
  }

  async buildSellTransaction(params: ISellParams) {
    const { walletAddress, exactAmountIn, tokenIn, gasBasePrice, minAmountOut, orderId = 'abc', coinObjs } = params;
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
      target: `${dexes.sevenkfun.package}::${dexes.sevenkfun.module}::sell_exact_in`, // package
      typeArguments: [tokenIn.address],
      arguments: [
        tx.object(dexes.sevenkfun.feeObjectId),
        tx.object(dexes.sevenkfun.configObjectId), // configObject,
        tx.object(coinObjs[0].coinObjectId), // tokenInObject
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(minAmountOut.toString()), // amountOutMin
        tx.pure.string(orderId), // orderId
        tx.object(dexes.sevenkfun.aggregatorConfigObjectId), //container
        tx.object(dexes.sevenkfun.aggregatorVaultObject!),
      ],
    });

    return tx;
  }
}
