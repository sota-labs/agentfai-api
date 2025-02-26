import { SuiTransactionBlockResponse } from '@mysten/sui/dist/cjs/client/types/generated';
import {
  EOrderSide,
  ESwapEvent,
  ETransactionModule,
  ETxStatus,
  mappingDexToTransactionModule,
  ROUTER_BUY_EVENT,
  ROUTER_SELL_EVENT,
  ROUTER_SWAP_EVENT,
} from 'common/constants/dex';
import { TokenDto } from 'common/dtos/raidenx.dto';
import { NumericUtils } from 'common/utils/numeric.utils';
import { RouterSwapEvent } from 'common/utils/onchain/sui-client';
import { TokenUtils } from 'common/utils/token.utils';
import { OrderBuyDocument } from 'modules/order/schemas/order-buy.schema';
import { OrderSellDocument } from 'modules/order/schemas/order-sell.schema';
import { Tx } from 'modules/tx/schemas/tx.schema';

export const transformOrderBuyToTx = (
  orderBuy: OrderBuyDocument,
  txResult: SuiTransactionBlockResponse,
  txHash: string,
): Tx => {
  console.log('orderBuy: ', orderBuy);
  const { amountOut, amountIn } = getAmountSwapEvent(txResult, {
    isBuyBySuiToken: TokenUtils.isSuiToken(orderBuy.tokenIn.address),
    txModule: mappingDexToTransactionModule(orderBuy.dex),
    side: EOrderSide.BUY,
  });

  const tx = new Tx();
  tx.userId = orderBuy.userId;
  tx.type = EOrderSide.BUY;
  tx.requestId = orderBuy.requestId;
  tx.payload = {
    walletAddress: orderBuy.walletAddress,
    poolId: orderBuy.poolId,
    tokenIn: orderBuy.tokenIn,
    tokenOut: orderBuy.tokenOut,
    dex: orderBuy.dex,
  };
  tx.txData = orderBuy.txData;
  tx.txHash = txHash;
  tx.amountIn = NumericUtils.toDecimal128(TokenUtils.weiToDecimal(amountIn, orderBuy.tokenIn.decimals));
  tx.amountOut = NumericUtils.toDecimal128(TokenUtils.weiToDecimal(amountOut, orderBuy.tokenOut.decimals));
  tx.status = txResult.effects?.status.status === 'success' ? ETxStatus.SUCCESS : ETxStatus.FAILED;
  return tx;
};

export const transformOrderSellToTx = (
  orderSell: OrderSellDocument,
  txResult: SuiTransactionBlockResponse,
  txHash: string,
): Tx => {
  const { amountOut, amountIn } = getAmountSwapEvent(txResult, {
    isBuyBySuiToken: TokenUtils.isSuiToken(orderSell.tokenIn.address),
    txModule: mappingDexToTransactionModule(orderSell.dex),
    side: EOrderSide.SELL,
  });

  const tx = new Tx();
  tx.userId = orderSell.userId;
  tx.type = EOrderSide.SELL;
  tx.requestId = orderSell.requestId;
  tx.payload = {
    walletAddress: orderSell.walletAddress,
    poolId: orderSell.poolId,
    tokenIn: orderSell.tokenIn,
    tokenOut: orderSell.tokenOut,
    dex: orderSell.dex,
  };
  tx.txData = orderSell.txData;
  tx.txHash = txHash;
  tx.amountIn = NumericUtils.toDecimal128(TokenUtils.weiToDecimal(amountIn, orderSell.tokenIn.decimals));
  tx.amountOut = NumericUtils.toDecimal128(TokenUtils.weiToDecimal(amountOut, orderSell.tokenOut.decimals));
  tx.status = txResult.effects?.status.status === 'success' ? ETxStatus.SUCCESS : ETxStatus.FAILED;
  return tx;
};

export const getAmountSwapEvent = (
  txResponse: SuiTransactionBlockResponse,
  options?: { isBuyBySuiToken?: boolean; txModule?: ETransactionModule; side: EOrderSide },
): { amountOut: string; amountIn: string } => {
  if (options?.txModule === ETransactionModule.Suiai && options?.isBuyBySuiToken) {
    const buySellEventSuiToSuai = txResponse.events.find(
      (event) =>
        (event.type.includes(ROUTER_BUY_EVENT) || event.type.includes(ROUTER_SELL_EVENT)) &&
        event.transactionModule == ETransactionModule.Cetus,
    );

    if (!buySellEventSuiToSuai) {
      throw new Error('Swap event not found');
    }
    const amountIn = (buySellEventSuiToSuai.parsedJson as RouterSwapEvent).amount_in;

    const swapEventSuaiToToken = txResponse.events.find(
      (event) => event.type.includes(ROUTER_SWAP_EVENT) && event.transactionModule == ETransactionModule.Suiai,
    );

    if (!swapEventSuaiToToken) {
      throw new Error('Swap event not found');
    }
    const amountOut = (swapEventSuaiToToken.parsedJson as any).coin_amount;

    return {
      amountOut,
      amountIn,
    };
  }

  // Buy with SUAI
  if (options?.txModule === ETransactionModule.Suiai && !options?.isBuyBySuiToken) {
    const swapEventSuaiToToken = txResponse.events.find((event) => event.type.includes(ROUTER_SWAP_EVENT));
    const buyEventSuaiToToken = txResponse.events.find(
      (event) => event.type.includes(ROUTER_BUY_EVENT) || event.type.includes(ROUTER_SELL_EVENT),
    );

    if (!swapEventSuaiToToken) {
      throw new Error('Swap event not found');
    }
    if (!buyEventSuaiToToken) {
      throw new Error('Buy event not found');
    }
    const amountIn = (buyEventSuaiToToken.parsedJson as RouterSwapEvent).amount_in;
    const amountOut =
      options?.side === EOrderSide.BUY
        ? (swapEventSuaiToToken.parsedJson as any).coin_amount
        : (swapEventSuaiToToken.parsedJson as any).sui_amount;
    console.log('amountOut: ', amountOut);

    return {
      amountOut,
      amountIn,
    };
  }
  const swapEvent = txResponse.events.find(
    (event) => event.type.includes(ESwapEvent.BuyEvent) || event.type.includes(ESwapEvent.SellEvent),
  );

  if (!swapEvent) {
    throw new Error('Failed to get swap event');
  }

  const buySellEventData = swapEvent.parsedJson as RouterSwapEvent;
  let amountOut = buySellEventData.amount_out;

  // check locked pool if dex = sevenkfun
  if (swapEvent.transactionModule === ETransactionModule.SevenKFun) {
    const lockedPoolInfo = txResponse.events.find((event) => event.type.includes(ESwapEvent.SwapEvent))?.parsedJson as {
      amount_in: string;
      amount_out: string;
      locked_amount: string;
    };
    if (!lockedPoolInfo) {
      throw new Error('Locked pool info not found');
    }

    if (!NumericUtils.isZero(lockedPoolInfo.locked_amount)) {
      amountOut = lockedPoolInfo.locked_amount;
    }
  }

  return {
    amountOut,
    amountIn: buySellEventData.amount_in,
  };
};

export const isLockedToken = (token: TokenDto): boolean => {
  return !!token?.lockTimestamp && NumericUtils.isGt(token.lockTimestamp, new Date().getTime());
};
