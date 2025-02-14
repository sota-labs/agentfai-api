import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { TCoinMetadata } from 'common/types/coin.type';
import { BaseDexUtils, IDexUtils } from 'common/utils/dexes/base.dex.utils';
import raidenxConfig from 'config/raidenx.config';
import { TSwapParams } from 'common/types/dex.type';

const { dexes } = raidenxConfig();

export class TurbosFunDexUtils extends BaseDexUtils implements IDexUtils {
  async buildBuyParams(params: TSwapParams): Promise<any> {
    console.log(params);
    throw new Error('Method not implemented.');
  }

  async buildSellParams(params: TSwapParams): Promise<any> {
    console.log(params);
    throw new Error('Method not implemented.');
  }

  async buildBuyTransaction(params: {
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
        tx.pure.u64(0), // amountOutMin
        tx.object('0x6'),
        tx.pure.string('abc'), // orderId
      ],
    });

    return tx;
  }

  async buildSellTransaction(params: {
    walletAddress: string;
    exactAmountIn: BigNumber | string | number;
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
        tx.pure.u64(0), // amountOutMin
        tx.object('0x6'),
        tx.pure.string('abc'), // orderId
      ],
    });

    return tx;
  }
}
