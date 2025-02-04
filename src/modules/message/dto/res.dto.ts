import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MessageThreadResDto {
  @Expose()
  @ApiProperty({ type: String, example: '66b000000000000000000000' })
  _id: string;

  @Expose()
  @ApiProperty({ type: String, example: '66b000000000000000000000' })
  agentId: string;

  @Expose()
  @ApiProperty({ type: String, example: '66b000000000000000000000' })
  threadId: string;

  @Expose()
  @ApiProperty({ type: String, example: 'What is the capital of France?' })
  question: string;

  @Expose()
  @ApiProperty({ type: String, example: 'Paris' })
  answer: string;

  @Expose()
  @ApiProperty({ type: Date, example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;
}
