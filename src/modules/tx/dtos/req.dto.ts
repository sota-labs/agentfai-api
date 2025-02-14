import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

@Exclude()
export class TxBuyReqDto {
  @Expose()
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tokenIn: string;

  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  poolId: string;

  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  @IsNumberString()
  amountIn: string;
}

@Exclude()
export class TxBuyBackendReqDto extends TxBuyReqDto {
  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}

export class ExecuteTxBuyReqDto {
  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  txRequestId: string;

  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
