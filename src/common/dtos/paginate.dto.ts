import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export abstract class BasePaginationResDto<T> {
  @Expose()
  @ApiProperty({
    type: Number,
    example: 57,
    description: 'Total number of documents in collection that match a query',
  })
  totalDocs: number;

  @Expose()
  @ApiProperty({
    type: Number,
    example: 6,
    description: 'Total number of pages.',
  })
  totalPages: number;

  @Expose()
  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Number of documents per page',
  })
  limit?: number;

  @Expose()
  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Current page number',
  })
  page?: number;

  abstract docs: T[];
}
