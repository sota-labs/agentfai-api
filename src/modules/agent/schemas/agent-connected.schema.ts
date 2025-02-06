import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import MongoosePaginate from 'mongoose-paginate-v2';

export type AgentConnectedDocument = AgentConnected & Document;

@Schema({ timestamps: true, collection: 'agent-connected' })
export class AgentConnected {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  agentId: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  clientSecret: string;

  @Prop({ required: true })
  accessTokenExpiresAt: number;

  @Prop({ required: true })
  refreshTokenExpiresAt: number;
}

export const AgentConnectedSchema = SchemaFactory.createForClass(AgentConnected);
AgentConnectedSchema.index({ userId: 1, agentId: 1 }, { unique: true });
AgentConnectedSchema.plugin(MongoosePaginate);
