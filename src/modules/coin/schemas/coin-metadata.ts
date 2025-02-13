import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import MongoosePaginate from 'mongoose-paginate-v2';

export type CoinMetadataDocument = CoinMetadata & Document;

@Schema({ timestamps: true, collection: 'coin-metadata' })
export class CoinMetadata {
  @Prop({ required: true })
  tokenAddress: string;

  @Prop({ required: true })
  decimals: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  symbol: string;

  @Prop()
  description: string;

  @Prop()
  iconUrl: string;
}

export const CoinMetadataSchema = SchemaFactory.createForClass(CoinMetadata);
CoinMetadataSchema.index({ tokenAddress: 1 }, { unique: true });
CoinMetadataSchema.plugin(MongoosePaginate);
