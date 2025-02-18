import { SuiTransactionBlockResponse } from '@mysten/sui/dist/cjs/client/types/generated';
import { EOrderSide, ESwapEvent, ETxStatus } from 'common/constants/dex';
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
  const { amountOut, amountIn } = getAmountSwapEvent(txResult);

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
  const { amountOut, amountIn } = getAmountSwapEvent(txResult);

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

export const getAmountSwapEvent = (response: SuiTransactionBlockResponse): { amountOut: string; amountIn: string } => {
  const swapEvent = response.events.find(
    (event) => event.type.includes(ESwapEvent.BuyEvent) || event.type.includes(ESwapEvent.SellEvent),
  );

  if (!swapEvent) {
    throw new Error('Swap event not found');
  }

  const swapEventData = swapEvent.parsedJson as RouterSwapEvent;

  return {
    amountOut: swapEventData.amount_out,
    amountIn: swapEventData.amount_in,
  };
};
