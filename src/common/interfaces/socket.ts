import { EOrderSide } from 'common/constants/dex';

export interface IWsOrderReqPayload {
  orderSide: EOrderSide;
  requestId: string;
  txData: string;
}

export interface IWsOrderResultPayload {
  requestId: string;
  orderSide: EOrderSide;
  txHash: string;
  status: string;
}

export interface IWsOrderSignaturePayload {
  orderSide: EOrderSide;
  requestId: string;
  signature: string;
}
