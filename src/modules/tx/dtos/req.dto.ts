import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

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
