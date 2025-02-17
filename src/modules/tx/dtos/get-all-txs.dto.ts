import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { BasePaginationResDto } from 'common/dtos/paginate.dto';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';
import { TxStatus, TxType } from 'modules/tx/schemas/tx.schema';

export class GetAllTxQuery {
  @ApiProperty({
    enum: TxType,
    enumName: 'TxType',
    example: '',
    default: null,
    description: 'Type of tx to filter. If not provided, all txs will be returned.',
    required: false,
  })
  @IsOptional()
  @IsEnum(TxType)
  type?: TxType;

  @ApiProperty({
    example: '',
    description: 'The request id of the tx',
    required: false,
  })
  @IsOptional()
  requestId?: string;

  @ApiProperty({
    description: 'The pool id of the tx',
    required: false,
  })
  @IsOptional()
  poolId?: string;

  @ApiProperty({
    description: 'The tx hash of the tx',
    required: false,
  })
  @IsOptional()
  txHash?: string;

  @ApiProperty({
    description: 'The wallet address of the tx',
    required: false,
  })
  @IsOptional()
  walletAddress?: string;

  @ApiProperty({
    description: 'The token symbol of the tx',
    required: false,
  })
  @IsOptional()
  tokenSymbol?: string;
}

export class TxPayloadDto {
  @ApiProperty({ example: '0x123', description: 'The wallet address of the tx' })
  walletAddress: string;

  @ApiProperty({ example: '0x123', description: 'The pool id of the tx' })
  poolId: string;

  @ApiProperty({ type: CoinMetadata, description: 'The token in of the tx' })
  tokenIn: CoinMetadata;
}

@Exclude()
export class TxDtoResponse {
  @Expose()
  @ApiProperty({ example: '123', description: 'The id of the tx' })
  _id: string;

  @Expose()
  @ApiProperty({ example: '123', description: 'The id of the tx' })
  userId: string;

  @Expose()
  @ApiProperty({ example: TxType.BUY, description: 'The type of the tx' })
  type: TxType;

  @Expose()
  @ApiProperty({ example: TxStatus.SUCCESS, description: 'The status of the tx' })
  status: TxStatus;

  @Expose()
  @ApiProperty({ type: TxPayloadDto, description: 'The payload of the tx' })
  payload: TxPayloadDto;

  @Expose()
  @ApiProperty({ example: '123', description: 'The id of the tx' })
  txHash: string;

  @Expose()
  @ApiProperty({ example: '12812', description: 'The amount in of the tx' })
  @Type(() => String)
  @Transform(({ value }) => (value ? value.toString() : null))
  amountIn: string;

  @Expose()
  @ApiProperty({ example: '1', description: 'The amount out of the tx' })
  @Type(() => String)
  @Transform(({ value }) => (value ? value.toString() : null))
  amountOut: string;
}

@Exclude()
export class PaginateTxsDto extends BasePaginationResDto<TxDtoResponse> {
  @Expose()
  @ApiProperty({
    type: TxDtoResponse,
    isArray: true,
  })
  @Type(() => TxDtoResponse)
  docs: TxDtoResponse[];
}
