import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { MessageStatus } from 'common/constants/agent';
import { BasePaginationResDto } from 'common/dtos/paginate.dto';

@Exclude()
export class MessageThreadResDto {
  @Expose()
  @ApiProperty({ type: String, example: '66b000000000000000000000' })
  @Transform(({ obj }) => obj._id.toString())
  id: string;

  @Expose()
  @ApiProperty({ type: String, example: '66b000000000000000000000' })
  agentId: string;

  @Expose()
  @ApiProperty({ type: String, example: '66b000000000000000000000' })
  threadId: string;

  @Expose()
  @ApiProperty({ type: String, example: MessageStatus.PROCESSING })
  status: MessageStatus;

  @Expose()
  @ApiProperty({ type: String, example: 'What is the capital of France?' })
  question: string;

  @Expose()
  @ApiProperty({ type: String, example: 'Paris' })
  answer: string;

  @Expose()
  @ApiProperty({ type: Number, example: 1712256000 })
  @Transform(({ obj }) => Math.floor(obj.createdAt.getTime() / 1000))
  createdAt: number;

  @Expose()
  @ApiProperty({ type: Number, example: 1712256000 })
  @Transform(({ obj }) => Math.floor(obj.updatedAt.getTime() / 1000))
  updatedAt: number;
}

@Exclude()
export class PaginateMessageResDto extends BasePaginationResDto<MessageThreadResDto> {
  @Expose()
  @ApiProperty({ type: [MessageThreadResDto] })
  @Type(() => MessageThreadResDto)
  docs: MessageThreadResDto[];
}

@Exclude()
export class MessageRoleResDto {
  @Expose()
  @ApiProperty({ type: String })
  role: string;

  @Expose()
  @ApiProperty({ type: String })
  content: string;

  @Expose()
  @ApiProperty({ type: String })
  agentId: string;

  @Expose()
  @ApiProperty({ type: Number, example: 1712256000 })
  createdAt: number;

  @Expose()
  @ApiProperty({ type: Number, example: 1712256000 })
  updatedAt: number;
}
