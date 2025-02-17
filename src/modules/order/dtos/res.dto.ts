import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { EOrderSide } from 'common/constants/dex';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';

@Exclude()
export class OrderResDto {
  @Expose()
  @ApiProperty({ required: true, description: 'Request ID' })
  requestId: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Transaction data' })
  txData: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Order side' })
  orderSide: EOrderSide;
}

@Exclude()
export class ExecuteOrderBuyResDto {
  @Expose()
  @ApiProperty({ required: true, description: 'Transaction hash' })
  txHash: string;
}

@Exclude()
export class OrderBuyResDto {
  @Expose()
  @ApiProperty({ required: true, description: 'Request ID' })
  requestId: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Wallet address' })
  walletAddress: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Pool ID' })
  poolId: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Amount in' })
  @Type(() => String)
  @Transform(({ value }) => value.toString())
  amountIn: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Token in' })
  @Type(() => CoinMetadata)
  tokenIn: CoinMetadata;

  @Expose()
  @ApiProperty({ required: true, description: 'Transaction data' })
  txData: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Timestamp' })
  timestamp: number;

  @Expose()
  @ApiProperty({ required: true, description: 'Status' })
  status: string;
}

@Exclude()
export class OrderSellResDto {
  @Expose()
  @ApiProperty({ required: true, description: 'Request ID' })
  requestId: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Wallet address' })
  walletAddress: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Pool ID' })
  poolId: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Percent' })
  percent: number;

  @Expose()
  @ApiProperty({ required: true, description: 'Amount in' })
  @Type(() => String)
  @Transform(({ value }) => value.toString())
  amountIn: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Token in' })
  @Type(() => CoinMetadata)
  tokenIn: CoinMetadata;

  @Expose()
  @ApiProperty({ required: true, description: 'Transaction data' })
  txData: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Timestamp' })
  timestamp: number;

  @Expose()
  @ApiProperty({ required: true, description: 'Status' })
  status: string;
}
