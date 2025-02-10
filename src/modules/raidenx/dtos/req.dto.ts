import { ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

@Exclude()
export class GetPositionsReq {
  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
  })
  @Transform(({ value }) => {
    switch (typeof value) {
      case 'boolean':
        return value;
      default:
        return value == 'true';
    }
  })
  closed?: boolean;

  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
  })
  @Transform(({ value }) => {
    switch (typeof value) {
      case 'boolean':
        return value;
      default:
        return value == 'true';
    }
  })
  isHidden?: boolean;

  @IsOptional()
  @Expose()
  @ApiPropertyOptional({
    type: String,
  })
  walletAddress?: string;
}
