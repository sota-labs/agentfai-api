import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MessageStatus } from 'common/constants/agent';
import { HydratedDocument } from 'mongoose';
import MongoosePaginate from 'mongoose-paginate-v2';

@Schema({ collection: 'messages', timestamps: true })
export class Message {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  agentId: string;

  @Prop({ required: true })
  threadId: string;

  @Prop({ required: true })
  question: string;

  @Prop({ required: false })
  answer: string;

  @Prop({ required: false, enum: MessageStatus, default: MessageStatus.PROCESSING })
  status: MessageStatus;

  createdAt: Date;

  updatedAt: Date;
}

export type MessageDocument = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ userId: 1 });
MessageSchema.index({ agentId: 1 });
MessageSchema.index({ threadId: 1 });
MessageSchema.plugin(MongoosePaginate);
