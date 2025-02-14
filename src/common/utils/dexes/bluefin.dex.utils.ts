import { normalizeStructTag } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { BaseDexUtils } from 'common/utils/dexes/base.dex.utils';
import { TCoinMetadata } from 'common/types/coin.type';
import { SUI_TOKEN_METADATA } from 'common/constants/common';
import { SUI_ADDRESS, SUI_TOKEN_ADDRESS_SHORT } from 'common/constants/address';
import { SuiClientUtils } from 'common/utils/onchain/sui-client';
import raidenxConfig from 'config/raidenx.config';

const { dexes } = raidenxConfig();

export class BluefinDexUtils extends BaseDexUtils {
  static async buildBuyTransaction(params: {
    walletAddress: string;
    exactAmountIn: BigNumber | string | number;
    gasBasePrice: bigint;
    poolObjectId: string;
    tokenIn?: TCoinMetadata;
  }) {
    const { walletAddress, exactAmountIn, gasBasePrice, poolObjectId, tokenIn = SUI_TOKEN_METADATA } = params;
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
      target: `${dexes.bluefin.package}::${dexes.bluefin.module}::buy_exact_in`,
      typeArguments: [tokenXAddress, tokenYAddress],
      arguments: [
        tx.object(dexes.bluefin.configObjectId),
        tx.object(poolObjectId),
        tokenXObject,
        tokenYObject,
        tx.pure.u64(exactAmountIn.toString()),
        tx.pure.u64(0),
        tx.pure.u128(xToY ? BigInt('4295048017') : BigInt('79226673515401279992447579054')),
        tx.object('0x6'),
        tx.pure.bool(xToY ? true : false), // buy = false, sell = true
        tx.pure.string('abc'),
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
    poolObjectId: string;
  }) {
    const { walletAddress, exactAmountIn, gasBasePrice, poolObjectId, tokenIn = SUI_TOKEN_METADATA, coinObjs } = params;
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
      target: `${dexes.bluefin.package}::${dexes.bluefin.module}::sell_exact_in`, // package
      typeArguments: [tokenXAddress, tokenYAddress],
      arguments: [
        tx.object(dexes.bluefin.configObjectId), // dex config cetus
        tx.object(poolObjectId), // pool address
        tokenXObject,
        tokenXObject,
        tokenYObject,
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(0), // amountOutMin
        tx.pure.u128(xToY ? BigInt('4295048017') : BigInt('79226673515401279992447579054')), // hardcode
        tx.object('0x6'), // clock
        tx.pure.bool(xToY ? true : false), // buy = false, sell = true
        tx.pure.string('abc'), // orderId
      ],
    });
    return tx;
  }
}
