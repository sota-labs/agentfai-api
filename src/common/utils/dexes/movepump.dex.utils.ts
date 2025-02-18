import { Transaction } from '@mysten/sui/transactions';
import { CoinStruct } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import retry from 'async-retry';
import { TCoinMetadata } from 'common/types/coin.type';
import { BaseDexUtils, IDexUtils } from 'common/utils/dexes/base.dex.utils';
import raidenxConfig from 'config/raidenx.config';
import { TSwapParams } from 'common/types/dex.type';
import {
  RETRY_MAX_ATTEMPT,
  RETRY_MAX_TIMEOUT,
  RETRY_MIN_TIMEOUT,
  suiClient,
  SuiClientUtils,
} from 'common/utils/onchain/sui-client';

const { dexes } = raidenxConfig();

interface MoveObjectId {
  id: string;
}

interface MovePumpPoolContent {
  id: MoveObjectId;
  is_completed: boolean;
  real_sui_reserves: any;
  real_token_reserves: any;
  remain_token_reserves: any;
  virtual_sui_reserves: string;
  virtual_token_reserves: string;
}

interface IBuyParams {
  walletAddress: string;
  maxAmountIn: BigNumber | string | number;
  exactAmountOut: BigNumber | string | number;
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

export class MovepumpDexUtils extends BaseDexUtils implements IDexUtils {
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
    const exactAmountIn = new BigNumber(params.amountIn)
      .multipliedBy(10 ** params.tokenIn.decimals)
      .integerValue(BigNumber.ROUND_FLOOR);

    const amountOutExpect = await this._getAmountOutExpectOnChain(params.poolId, exactAmountIn);
    const maxAmountIn = exactAmountIn.multipliedBy(1 + params.slippage / 100).integerValue(BigNumber.ROUND_FLOOR);

    return {
      walletAddress: params.walletAddress,
      maxAmountIn: maxAmountIn,
      exactAmountOut: amountOutExpect,
      tokenOut: params.tokenOut,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
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
      minAmountOut: minAmountOut,
      tokenIn: params.tokenIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      coinObjs: simulateParams.coinObjs,
    };
  }

  async buildBuyTransaction(params: IBuyParams) {
    const { walletAddress, maxAmountIn, exactAmountOut, tokenOut, gasBasePrice, orderId = 'abc' } = params;
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    tx.setSender(walletAddress);
    tx.setGasPrice(gasBasePrice);

    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(maxAmountIn.toString())]);

    tx.moveCall({
      target: `${dexes.movepump.package}::${dexes.movepump.module}::buy_exact_out`, // package
      typeArguments: [
        tokenOut.address, // tokenAddress
      ],
      arguments: [
        tx.object(
          dexes.movepump.feeObjectId, // feeObject
        ),
        tx.object(dexes.movepump.configObjectId),
        coin,
        tx.object(dexes.movepump.dexObjectId),
        tx.pure.u64(exactAmountOut.toString()),
        tx.pure.u64(maxAmountIn.toString()),
        tx.object('0x6'),
        tx.pure.string(orderId),
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
      target: `${dexes.movepump.package}::${dexes.movepump.module}::sell_exact_in`, // package
      typeArguments: [tokenIn.address],
      arguments: [
        tx.object(
          dexes.movepump.feeObjectId, // feeObject
        ),
        tx.object(dexes.movepump.configObjectId), // configObject,
        tx.object(coinObjs[0].coinObjectId), // tokenInObject
        tx.pure.u64(exactAmountIn.toString()), // amountIn
        tx.pure.u64(minAmountOut.toString()), // amountOutMin
        tx.object('0x6'), // clock
        tx.pure.string(orderId), // orderId
      ],
    });

    return tx;
  }

  private async _getAmountOutExpectOnChain(poolId: string, exactAmountIn: BigNumber): Promise<BigNumber> {
    let client = suiClient;
    return await retry(
      async () => {
        const poolObj = await client.getObject({
          id: poolId,
          options: {
            showContent: true,
          },
        });
        console.log(poolObj);
        const poolContent = poolObj.data!.content;

        if (!poolContent || poolContent.dataType !== 'moveObject') {
          throw new Error('Invalid pool content');
        }

        const poolContentFields = poolContent.fields as unknown as MovePumpPoolContent;

        const amountInWithFee = exactAmountIn
          .multipliedBy(1.0 - dexes.movepump.tradingFee!)
          .integerValue(BigNumber.ROUND_FLOOR);

        const amountExpectDecimals = this._calculateUniV2ExactOut(
          amountInWithFee,
          BigNumber(poolContentFields.virtual_sui_reserves),
          BigNumber(poolContentFields.virtual_token_reserves),
          BigNumber(dexes.movepump.fee!),
        );

        return amountExpectDecimals;
      },
      {
        retries: RETRY_MAX_ATTEMPT,
        minTimeout: RETRY_MIN_TIMEOUT,
        maxTimeout: RETRY_MAX_TIMEOUT,
        onRetry: (e, attempt) => {
          console.log(`simulateBuyExactOutMovepump retry ${attempt}`, e);
          client = SuiClientUtils.getSuiClient(attempt);
        },
      },
    );
  }

  private _calculateUniV2ExactOut(
    amountIn: BigNumber,
    reserveIn: BigNumber,
    reserveOut: BigNumber,
    fee: BigNumber,
  ): BigNumber {
    const amountInWithFee = amountIn.multipliedBy(BigNumber(1).minus(fee)).integerValue(BigNumber.ROUND_FLOOR);
    const numerator = amountInWithFee.multipliedBy(reserveOut);
    const denominator = reserveIn.plus(amountInWithFee);
    return numerator.dividedBy(denominator).integerValue(BigNumber.ROUND_FLOOR);
  }
}
