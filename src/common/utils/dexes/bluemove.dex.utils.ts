import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { BaseDexUtils, IDexUtils } from 'common/utils/dexes/base.dex.utils';
import { TCoinMetadata } from 'common/types/coin.type';
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
  exactAmountIn: BigNumber;
  minAmountOut: BigNumber | string | number;
  tokenIn: TCoinMetadata;
  gasBasePrice: bigint;
  coinObjs: (CoinStruct & { owner: string })[];
  orderId?: string;
}

export class BluemoveDexUtils extends BaseDexUtils implements IDexUtils {
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
      walletAddress: params.walletAddress,
      exactAmountIn: simulateParams.exactAmountIn,
      minAmountOut: minAmountOut,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      tokenOut: params.tokenOut,
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
      walletAddress: params.walletAddress,
      exactAmountIn: simulateParams.exactAmountIn,
      minAmountOut,
      tokenIn: params.tokenIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      coinObjs: simulateParams.coinObjs,
      orderId: params.orderId,
    };
  }

  async buildBuyTransaction(params: IBuyParams) {
    const { walletAddress, exactAmountIn, tokenOut, gasBasePrice, orderId = 'abc' } = params;

    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(exactAmountIn.toString())]);

    tx.moveCall({
      target: `${dexes.bluemove.package}::${dexes.bluemove.module}::buy_exact_in`, // package
      typeArguments: [tokenOut.address],
      arguments: [
        tx.object(dexes.bluemove.feeObjectId),
        tx.pure.u64(exactAmountIn.toString()),
        coin,
        tx.pure.u64(0),
        tx.object(dexes.bluemove.configObjectId),
        tx.pure.string(orderId),
      ],
    });
    return tx;
  }

  async buildSellTransaction(params: ISellParams) {
    const { walletAddress, exactAmountIn, tokenIn, gasBasePrice, coinObjs, orderId = 'abc' } = params;

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
      target: `${dexes.bluemove.package}::${dexes.bluemove.module}::sell_exact_in`, // package
      typeArguments: [tokenIn.address],
      arguments: [
        tx.object(dexes.bluemove.feeObjectId),
        tx.pure.u64(exactAmountIn.toString()),
        tx.object(coinObjs[0].coinObjectId),
        tx.pure.u64(0),
        tx.object(dexes.bluemove.configObjectId),
        tx.pure.string(orderId),
      ],
    });
    return tx;
  }
}
