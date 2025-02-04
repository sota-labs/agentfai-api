import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ThreadStatus } from 'common/constants/agent';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'threads', timestamps: true })
export class Thread {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ThreadStatus, default: ThreadStatus.ACTIVE })
  status: ThreadStatus;
}

export type ThreadDocument = HydratedDocument<Thread>;
export const ThreadSchema = SchemaFactory.createForClass(Thread);
ThreadSchema.index({ agentId: 1 });
ThreadSchema.index({ userId: 1 });
