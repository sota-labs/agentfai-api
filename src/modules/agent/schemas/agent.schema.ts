import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import MongoosePaginate from 'mongoose-paginate-v2';
export type AgentDocument = Agent & Document;

@Schema({ timestamps: true, collection: 'agents' })
export class Agent {
  @Prop({ required: true })
  agentId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);
AgentSchema.index({ agentId: 1 }, { unique: true });
AgentSchema.plugin(MongoosePaginate);
