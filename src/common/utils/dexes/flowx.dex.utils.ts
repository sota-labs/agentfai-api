import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { BaseDexUtils } from 'common/utils/dexes/base.dex.utils';
import { TCoinMetadata } from 'common/types/coin.type';
import raidenxConfig from 'config/raidenx.config';

const { dexes } = raidenxConfig();

export class FlowxDexUtils extends BaseDexUtils {
  static async buildBuyTransaction(params: {
    walletAddress: string;
    exactAmountIn: BigNumber | string | number;
    tokenOut: TCoinMetadata;
    gasBasePrice: bigint;
  }) {
    const { walletAddress, exactAmountIn, tokenOut, gasBasePrice } = params;
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);

    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(exactAmountIn.toString())]);

    tx.moveCall({
      target: `${dexes.flowx.package}::${dexes.flowx.module}::buy_exact_in`, // package
      typeArguments: [
        tokenOut.address, // tokenAddress
      ],
      arguments: [
        tx.object(dexes.flowx.feeObjectId), // feeObject
        tx.object(dexes.flowx.configObjectId), // container
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(0), // amountOutMin
        coin,
        tx.pure.string('abc'), // orderId
      ],
    });

    return tx;
  }

  static async buildSellTransaction(params: {
    walletAddress: string;
    exactAmountIn: BigNumber;
    tokenIn: TCoinMetadata;
    gasBasePrice: bigint;
    coinObjs: (CoinStruct & { owner: string })[];
  }) {
    const { walletAddress, exactAmountIn, tokenIn, gasBasePrice, coinObjs } = params;
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
      target: `${dexes.flowx.package}::${dexes.flowx.module}::sell_exact_in`, // package
      typeArguments: [
        tokenIn.address, // tokenAddress
      ],
      arguments: [
        tx.object(dexes.flowx.feeObjectId), // feeObject
        tx.object(dexes.flowx.configObjectId), // container
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(0), // amountOutMin
        tx.object(coinObjs[0].coinObjectId), // tokenInObject
        tx.pure.string('abc'), // orderId
      ],
    });

    return tx;
  }
}
