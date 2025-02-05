import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { MessageThreadResDto } from 'modules/message/dto/res.dto';
@Exclude()
export class ThreadResDto {
  @Expose()
  @ApiProperty({ type: String, example: '66b000000000000000000000' })
  _id: string;

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
  @ApiProperty({ type: Date, example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ type: [MessageThreadResDto] })
  messages: MessageThreadResDto[];
}
