import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { TCoinMetadata } from 'common/types/coin.type';
import { BaseDexUtils, IDexUtils } from 'common/utils/dexes/base.dex.utils';
import raidenxConfig from 'config/raidenx.config';
import { TSwapParams } from 'common/types/dex.type';
import { suiClient, SuiClientUtils } from 'common/utils/onchain/sui-client';

const { dexes } = raidenxConfig();

interface IBuyParams {
  walletAddress: string;
  exactAmountIn: BigNumber | string | number;
  minAmountOut: BigNumber | string | number;
  tokenOut: TCoinMetadata;
  gasBasePrice: bigint;
  orderId?: string;
}

interface ISellParams {
  walletAddress: string;
  exactAmountIn: BigNumber | string | number;
  minAmountOut: BigNumber | string | number;
  tokenIn: TCoinMetadata;
  gasBasePrice: bigint;
  coinObjs: (CoinStruct & { owner: string })[];
  orderId?: string;
}

export class TurbosFunDexUtils extends BaseDexUtils implements IDexUtils {
  async buildSimulateBuyParams(params: TSwapParams): Promise<IBuyParams> {
    const exactAmountIn = new BigNumber(params.amountIn)
      .multipliedBy(10 ** params.tokenIn.decimals)
      .integerValue(BigNumber.ROUND_FLOOR);

    return {
      walletAddress: params.walletAddress,
      exactAmountIn: exactAmountIn,
      minAmountOut: 0,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      tokenOut: params.tokenOut,
    };
  }

  async buildSimulateSellParams(params: TSwapParams): Promise<ISellParams> {
    const exactAmountIn = new BigNumber(params.amountIn)
      .multipliedBy(10 ** params.tokenIn.decimals)
      .integerValue(BigNumber.ROUND_FLOOR);

    const [coinObjs] = await SuiClientUtils.getOwnerCoinOnchain(params.walletAddress, params.tokenIn.address);

    return {
      walletAddress: params.walletAddress,
      exactAmountIn: exactAmountIn,
      minAmountOut: 0,
      tokenIn: params.tokenIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
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
      ...simulateParams,
      minAmountOut,
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
    const { walletAddress, exactAmountIn, minAmountOut, tokenOut, gasBasePrice, orderId = 'abc' } = params;
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);

    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(exactAmountIn.toString())]);

    tx.moveCall({
      target: `${dexes.turbosfun.package}::${dexes.turbosfun.module}::buy_exact_in`, // package
      typeArguments: [
        tokenOut.address, // tokenAddress
      ],
      arguments: [
        tx.object(
          dexes.turbosfun.feeObjectId, // feeObject
        ),
        tx.object(dexes.turbosfun.configObjectId),
        coin,
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(minAmountOut.toString()), // amountOutMin
        tx.object('0x6'),
        tx.pure.string(orderId), // orderId
      ],
    });

    return tx;
  }

  async buildSellTransaction(params: ISellParams) {
    const { walletAddress, exactAmountIn, minAmountOut, tokenIn, gasBasePrice, coinObjs, orderId = 'abc' } = params;
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
      target: `${dexes.turbosfun.package}::${dexes.turbosfun.module}::sell_exact_in`, // package
      typeArguments: [
        tokenIn.address, // tokenAddress
      ],
      arguments: [
        tx.object(
          dexes.turbosfun.feeObjectId, // feeObject
        ),
        tx.object(dexes.turbosfun.configObjectId),
        tx.object(coinObjs[0].coinObjectId),
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(minAmountOut.toString()), // amountOutMin
        tx.object('0x6'),
        tx.pure.string(orderId), // orderId
      ],
    });

    return tx;
  }
}
