import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';

@Exclude()
export class TxResDto {
  @Expose()
  @ApiProperty({ required: true, description: 'Request ID' })
  requestId: string;

  @Expose()
  @ApiProperty({ required: true, description: 'Transaction data' })
  txData: string;
}

@Exclude()
export class ExecuteTxBuyResDto {
  @Expose()
  @ApiProperty({ required: true, description: 'Transaction hash' })
  txHash: string;
}

@Exclude()
export class TxBuyResDto {
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
}
