import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import MongoosePaginate from 'mongoose-paginate-v2';
import { ThreadStatus } from 'common/constants/agent';

@Schema({ collection: 'threads', timestamps: true })
export class Thread {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ThreadStatus, default: ThreadStatus.ACTIVE })
  status: ThreadStatus;

  createdAt: Date;

  updatedAt: Date;
}

export type ThreadDocument = HydratedDocument<Thread>;
export const ThreadSchema = SchemaFactory.createForClass(Thread);
ThreadSchema.index({ userId: 1 });
ThreadSchema.plugin(MongoosePaginate);
