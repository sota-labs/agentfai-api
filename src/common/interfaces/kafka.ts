import { ENetwork } from 'common/constants/network';

export interface ICommonKafkaMessage {
  network: ENetwork;
}

export interface ITokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface IDexTradeTx extends ICommonKafkaMessage {
  sender: string;
  index: number;
  userId: string;
  pair: string;
  poolId: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  baseToken: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  baseAmount: string;
  quoteAmount: string;
  isBuy: boolean;
  volumeUsd: string;
  hash: string;
  timestamp: number;
  price: string;
  priceUsd: string;
}

export interface IAccountCreated extends ICommonKafkaMessage {
  userId: string;
  referralCode: string;
  walletAddress?: string;
  registeredAt: number;
  referrerId?: string;
}

export interface IOrderSuccess extends ICommonKafkaMessage {
  userId: string;
  id: string;
  walletAddress: string;
  orderType: string;
  status: string;
  pairId: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  amountIn: number;
  amountOut: number;
  payload?: {
    orderSetting: {
      slippage: number;
      priorityFee: string;
    };
  };
  version: number;
  sellPercent: number;
  hash: string;
  timestamp: number;
  tradingVolume: number;
  tradingVolumeUsd: number;
  tradingFee: number;
  tradingFeeUsd: number;
  refCode: string;
}

export interface ITokenTransferred extends ICommonKafkaMessage {
  type: 'Withdrawn' | 'Deposited';
  walletAddress: string;
  tokenAddress: string;
  amount: string;
  balance: string;
  timestamp: number;
  hash: string;
  logIndex: number;
  walletType: string;
  isSystemRouter: boolean;
  isDev: boolean;
  timeElapsedFromPoolCreated: number;
}

export interface ITxTrade {
  hash: string;
  index: number;
  timestamp: number;
  userId: string;
  sender: string;
  pair: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  baseAmount: string;
  quoteAmount: string;
  isBuy: boolean;
  volumeUsd: string;
  price: string;
  priceUsd: string;
}
