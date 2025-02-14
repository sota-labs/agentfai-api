import { TCoinMetadata } from 'common/types/coin.type';

export type TSwapParams = {
  walletAddress: string;
  tokenIn: TCoinMetadata;
  tokenOut: TCoinMetadata;
  poolId: string;
  amountIn: string;
  slippage: number;
  orderId?: string;
};
