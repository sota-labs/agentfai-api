import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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

  @Prop()
  answer: string;

  createdAt: Date;

  updatedAt: Date;
}

export type MessageDocument = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ userId: 1 });
MessageSchema.index({ agentId: 1 });
MessageSchema.index({ threadId: 1 });
MessageSchema.plugin(MongoosePaginate);
