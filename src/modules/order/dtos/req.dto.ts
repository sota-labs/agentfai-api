import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, Max, Min } from 'class-validator';

@Exclude()
export class OrderBuyReqDto {
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

  @Expose()
  @ApiProperty({ required: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  slippage: number;
}

@Exclude()
export class OrderBuyBackendReqDto extends OrderBuyReqDto {
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

export class ExecuteOrderBuyReqDto {
  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  orderRequestId: string;

  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  signature: string;
}

export class OrderSellReqDto {
  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  poolId: string;

  @Expose()
  @ApiProperty({ required: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  percent: number;

  @Expose()
  @ApiProperty({ required: true })
  @IsNumber()
  @Min(0)
  @Max(100)
  slippage: number;
}

export class SignatureReqDto {
  @Expose()
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
