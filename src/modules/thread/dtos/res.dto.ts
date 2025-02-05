import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { BasePaginationResDto } from 'common/dtos/paginate.dto';

@Exclude()
export class ThreadResDto {
  @Expose()
  @ApiProperty({ type: String, example: '66b000000000000000000000' })
  @Transform(({ obj }) => obj._id.toString())
  id: string;

  @Expose()
  @ApiProperty({ type: String, example: 'Thread 1' })
  name: string;

  @Expose()
  @ApiProperty({ type: String, example: '66b000000000000000000000' })
  userId: string;

  @Expose()
  @ApiProperty({ type: String, example: 'active' })
  status: string;

  @Expose()
  @ApiProperty({ type: Number, example: 1712256000 })
  @Transform(({ obj }) => Math.floor(obj.createdAt.getTime() / 1000))
  createdAt: number;
}

@Exclude()
export class PaginateThreadResDto extends BasePaginationResDto<ThreadResDto> {
  @Expose()
  @ApiProperty({ type: [ThreadResDto] })
  @Type(() => ThreadResDto)
  docs: ThreadResDto[];
}
