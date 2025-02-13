import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

@Exclude()
export class CoinMetadataDto {
  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  tokenAddress: string;

  @Expose()
  @ApiProperty({
    type: Number,
  })
  decimals: number;

  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  name: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  symbol: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  description: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  iconUrl: string;
}

@Exclude()
export class CoinPortfolio {
  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  coinType: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  coinObjectId: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  version: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  digest: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  balance: string;

  @Expose()
  @ApiProperty({
    type: String,
  })
  @Type(() => String)
  @Transform(({ value }) => value?.toString())
  previousTransaction: string;

  @Expose()
  @ApiProperty({
    type: CoinMetadataDto,
  })
  coinMetadata: CoinMetadataDto;
}

export class ListCoinMetadataResDto {
  @Expose()
  @ApiProperty({
    type: [CoinPortfolio],
  })
  docs: CoinPortfolio[];

  @Expose()
  @ApiProperty({
    type: String,
  })
  nextCursor: string;

  @Expose()
  @ApiProperty({
    type: Boolean,
  })
  hasNextPage: boolean;
}
