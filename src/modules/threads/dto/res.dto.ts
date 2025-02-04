import { Message } from 'modules/messages/messgae.schema';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ThreadResDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;

  @Expose()
  userId: string;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  messages: Message[];
}
