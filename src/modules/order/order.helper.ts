import { SuiTransactionBlockResponse } from '@mysten/sui/dist/cjs/client/types/generated';
import { Decimal128 } from 'bson';
import { OrderBuyDocument } from 'modules/order/schemas/order-buy.schema';
import { OrderSellDocument } from 'modules/order/schemas/order-sell.schema';
import { EOrderSide, ETxStatus } from 'common/constants/dex';

import { Tx } from 'modules/tx/schemas/tx.schema';

export const transferOrderBuyToTx = (
  orderBuy: OrderBuyDocument,
  txResult: SuiTransactionBlockResponse,
  txHash: string,
): Tx => {
  const amountOut =
    txResult.effects?.status.status === 'success' ? (txResult.events[0].parsedJson as any).amount_out : '0';

  const tx = new Tx();
  tx.userId = orderBuy.userId;
  tx.type = EOrderSide.BUY;
  tx.requestId = orderBuy._id.toString();
  tx.payload = {
    walletAddress: orderBuy.walletAddress,
    poolId: orderBuy.poolId,
    tokenIn: orderBuy.tokenIn,
  };
  tx.txData = orderBuy.txData;
  tx.txHash = txHash;
  tx.amountIn = Decimal128.fromString(orderBuy.amountIn.toString());
  tx.amountOut = Decimal128.fromString(amountOut.toString());
  tx.status = txResult.effects?.status.status === 'success' ? ETxStatus.SUCCESS : ETxStatus.FAILED;
  return tx;
};

export const transferOrderSellToTx = (
  orderSell: OrderSellDocument,
  txResult: SuiTransactionBlockResponse,
  txHash: string,
): Tx => {
  const amountOut =
    txResult.effects?.status.status === 'success' ? (txResult.events[0].parsedJson as any).amount_out : '0';

  const tx = new Tx();
  tx.userId = orderSell.userId;
  tx.type = EOrderSide.SELL;
  tx.requestId = orderSell._id.toString();
  tx.payload = {
    walletAddress: orderSell.walletAddress,
    poolId: orderSell.poolId,
    tokenIn: orderSell.tokenIn,
  };
  tx.txData = orderSell.txData;
  tx.txHash = txHash;
  tx.amountIn = Decimal128.fromString(orderSell.amountIn.toString());
  tx.amountOut = Decimal128.fromString(amountOut.toString());
  tx.status = txResult.effects?.status.status === 'success' ? ETxStatus.SUCCESS : ETxStatus.FAILED;
  return tx;
};
