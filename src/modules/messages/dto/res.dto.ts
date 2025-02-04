import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MessageResDto {
  @Expose()
  _id: string;

  @Expose()
  agentId: string;

  @Expose()
  threadId: string;

  @Expose()
  question: string;

  @Expose()
  answer: string;

  @Expose()
  createdAt: Date;
}
