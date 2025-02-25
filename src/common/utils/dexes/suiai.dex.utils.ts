import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { BaseDexUtils, IDexUtils } from 'common/utils/dexes/base.dex.utils';
import { TCoinMetadata } from 'common/types/coin.type';
import raidenxConfig from 'config/raidenx.config';
import { SUI_ADDRESS, SUI_TOKEN_ADDRESS_SHORT } from 'common/constants/address';
import { suiClient, SuiClientUtils } from 'common/utils/onchain/sui-client';
import { SUI_TOKEN_METADATA } from 'common/constants/common';
import { TSwapParams } from 'common/types/dex.type';
import { NumericUtils } from 'common/utils/numeric.utils';
import { TokenUtils } from 'common/utils/token.utils';
import { ETransactionModule } from 'common/constants/dex';

const { dexes } = raidenxConfig();

const PACKAGE_CETUS = '0x13a090e2ce489162ee140e3763e3d262897e98683c0bd2626b4dc8786319139b';
const PACKAGE_SUIAI_ROUTER = '0x4bbfd1c0ee1ef98648abbd8a046315ff72de39a55eba39c0635f90df37603cb2';
const SHARE_OBJECT_CONFIG_CETUS = '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f';
const POOL_SUIAI_SUI_OBJECT_ID = '0x7852612f5bf73613021f17353985fc186b3b224139c6a2576239132ba5a33b66';
const SHARE_OBJECT_CONFIG_SUIAI = '0xd9b810f0d1f4c024dd7190bac834de764cb09054246f86981cb63d36ae51bf5c';

interface IBuyParams {
  walletAddress: string;
  exactAmountIn: BigNumber | string | number;
  minAmountOut: BigNumber | string | number;
  gasBasePrice: bigint;
  poolObjectId: string;
  tokenIn: TCoinMetadata;
  tokenOut: TCoinMetadata;
  orderId: string;
  isBuyBySuiToken: boolean;
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

export class SuiAiDexUtils extends BaseDexUtils implements IDexUtils {
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
      orderId: params.orderId,
      isBuyBySuiToken: TokenUtils.isSuiToken(params.tokenIn.address),
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

    const { amountOut } = SuiClientUtils.extractTokenAmountByTxModule(simulateResponse, {
      txModule: ETransactionModule.Suiai,
      isBuyBySuiToken: simulateParams.isBuyBySuiToken,
    });

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
      orderId: params.orderId,
      isBuyBySuiToken: simulateParams.isBuyBySuiToken,
    };
  }

  async buildSellParams(params: TSwapParams): Promise<any> {
    console.log(params);
    throw new Error('Method not implemented.');
  }

  async buildBuyBySuiToken(params: {
    walletAddress: string;
    exactAmountIn: BigNumber | string | number;
    tokenOut: TCoinMetadata;
    gasBasePrice: bigint;
    poolObjectId: string;
    tokenIn: TCoinMetadata;
    orderId?: string;
  }) {
    const { walletAddress, exactAmountIn, tokenOut, gasBasePrice, poolObjectId, tokenIn, orderId = 'abc' } = params;
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);

    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(exactAmountIn.toString())]);

    const token = tx.moveCall({
      target: `${PACKAGE_CETUS}::cetus_router::buy_exact_in_second_return`,
      typeArguments: [tokenIn.address],
      arguments: [
        tx.object(SHARE_OBJECT_CONFIG_CETUS),
        tx.object(POOL_SUIAI_SUI_OBJECT_ID),
        coin,
        tx.pure.u64(exactAmountIn.toString()),
        tx.pure.u64(0),
        tx.object('0x6'),
        tx.pure.string(orderId),
      ],
    });

    tx.moveCall({
      target: `${PACKAGE_SUIAI_ROUTER}::suiai_router::buy_exact_in_v2`,
      typeArguments: [tokenOut.address],
      arguments: [
        tx.object(SHARE_OBJECT_CONFIG_SUIAI),
        tx.object(poolObjectId),
        token,
        tx.pure.u64(0),
        tx.pure.string('abc'),
      ],
    });

    return tx;
  }

  async buildBuyTransaction(params: IBuyParams) {
    const { walletAddress, exactAmountIn, tokenOut, gasBasePrice, poolObjectId, tokenIn, orderId, isBuyBySuiToken } =
      params;
    if (isBuyBySuiToken) {
      return await this.buildBuyBySuiToken({
        walletAddress,
        exactAmountIn,
        tokenOut,
        gasBasePrice,
        poolObjectId,
        tokenIn,
        orderId,
      });
    }

    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);

    let coinTokenIn = null;

    let isPairWithSui = false;
    if (TokenUtils.isSuiToken(tokenIn.address)) {
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(exactAmountIn.toString())]);
      coinTokenIn = coin;
      isPairWithSui = true;
    } else {
      const [tokenInObjects] = await SuiClientUtils.getOwnerCoinOnchain(walletAddress, tokenIn.address);
      if (tokenInObjects.length > 1) {
        tx.mergeCoins(
          tokenInObjects[0].coinObjectId,
          tokenInObjects.slice(1).map((coin) => coin.coinObjectId),
        );
      }

      const totalAmount = tokenInObjects.reduce((sum, coin) => sum.plus(coin.balance), new BigNumber(0));
      const amountInBigInt = new BigNumber(exactAmountIn.toString());

      if (NumericUtils.isLt(totalAmount, amountInBigInt)) {
        throw new Error(`Insufficient balance. Required: ${exactAmountIn}, Available: ${totalAmount}`);
      }

      const [splitCoin] = tx.splitCoins(tokenInObjects[0].coinObjectId, [tx.pure.u64(exactAmountIn.toString())]);
      coinTokenIn = splitCoin;
    }

    if (isPairWithSui) {
      tx.moveCall({
        target: `${dexes.suiaifun.package}::${dexes.suiaifun.module}::buy_exact_in_v1`,
        typeArguments: [tokenOut.address],
        arguments: [
          tx.object(dexes.suiaifun.configObjectIdSui || ''),
          tx.object(poolObjectId),
          coinTokenIn,
          tx.pure.u64(exactAmountIn.toString()),
          tx.pure.u64(0),
          tx.pure.string(params.orderId || 'abc'),
        ],
      });
    } else {
      console.log('buy_exact_in_v2');
      if (!NumericUtils.isEqual(TokenUtils.weiToDecimal(exactAmountIn.toString(), tokenIn.decimals), 1)) {
        console.log('exactAmountIn: ', exactAmountIn.toString());
        throw new Error('test');
      }
      tx.moveCall({
        target: `${dexes.suiaifun.package}::${dexes.suiaifun.module}::buy_exact_in_v2`,
        typeArguments: [tokenOut.address],
        arguments: [
          tx.object(dexes.suiaifun.configObjectId),
          tx.object(poolObjectId),
          coinTokenIn,
          tx.pure.u64('0'),
          tx.pure.string(params.orderId || 'abc'),
        ],
      });
    }
    return tx;
  }

  async buildSellTransaction(params: {
    walletAddress: string;
    exactAmountIn: BigNumber;
    tokenIn: TCoinMetadata;
    gasBasePrice: bigint;
    coinObjs: (CoinStruct & { owner: string })[];
    poolObjectId: string;
    tokenOut?: TCoinMetadata;
  }) {
    const {
      walletAddress,
      exactAmountIn,
      tokenIn,
      gasBasePrice,
      coinObjs,
      poolObjectId,
      tokenOut = SUI_TOKEN_METADATA,
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

    let isPairWithSui = false;
    if (tokenOut.address === SUI_TOKEN_ADDRESS_SHORT || tokenOut.address === SUI_ADDRESS) {
      isPairWithSui = true;
    }

    if (isPairWithSui) {
      tx.moveCall({
        target: `${dexes.suiaifun.package}::${dexes.suiaifun.module}::sell_exact_in_v1`, // package
        typeArguments: [tokenIn.address],
        arguments: [
          tx.object(dexes.suiaifun.configObjectIdSui || ''), // dex config cetus
          tx.object(poolObjectId), // pool address
          tx.object(coinObjs[0].coinObjectId),
          tx.pure.u64(exactAmountIn.toString()), // amountIn
          tx.pure.u64(0), // amountOutMin
          tx.pure.string('abc'), // orderId
        ],
      });
    } else {
      tx.moveCall({
        target: `${dexes.suiaifun.package}::${dexes.suiaifun.module}::sell_exact_in_v2`, // package
        typeArguments: [tokenIn.address],
        arguments: [
          tx.object(dexes.suiaifun.configObjectId), // dex config cetus
          tx.object(poolObjectId), // pool address
          tx.object(coinObjs[0].coinObjectId),
          tx.pure.u64(exactAmountIn.toString()), // amountIn
          tx.pure.u64(0), // amountOutMin
          tx.pure.string('abc'), // orderId
        ],
      });
    }
    return tx;
  }
}
