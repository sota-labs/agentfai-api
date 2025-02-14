import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { TCoinMetadata } from 'common/types/coin.type';
import { BaseDexUtils } from 'common/utils/dexes/base.dex.utils';
import raidenxConfig from 'config/raidenx.config';
import { SUI_TOKEN_ADDRESS_SHORT } from 'common/constants/address';

const { dexes } = raidenxConfig();

export class TurbosDexUtils extends BaseDexUtils {
  static async buildBuyTransaction(params: {
    walletAddress: string;
    exactAmountIn: BigNumber | string | number;
    tokenOut: TCoinMetadata;
    gasBasePrice: bigint;
    feeTierAddress: string;
    poolObjectId: string;
  }) {
    const { walletAddress, exactAmountIn, tokenOut, gasBasePrice, feeTierAddress, poolObjectId } = params;
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
        tx.pure.string('abc'), // orderId
      ],
    });

    return tx;
  }

  static async buildSellTransaction(params: {
    walletAddress: string;
    exactAmountIn: BigNumber | string | number;
    tokenIn: TCoinMetadata;
    gasBasePrice: bigint;
    feeTierAddress: string;
    poolObjectId: string;
    coinObjs: (CoinStruct & { owner: string })[];
  }) {
    const { walletAddress, exactAmountIn, tokenIn, gasBasePrice, feeTierAddress, poolObjectId, coinObjs } = params;
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
        tx.pure.string('abc'), // orderId
      ],
    });

    return tx;
  }
}
