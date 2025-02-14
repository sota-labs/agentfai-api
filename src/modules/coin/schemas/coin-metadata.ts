import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import MongoosePaginate from 'mongoose-paginate-v2';

export type CoinMetadataDocument = CoinMetadata & Document;

@Schema({ timestamps: true, collection: 'coin-metadata' })
export class CoinMetadata {
  @Prop({ required: true })
  @ApiProperty({ required: true, description: 'Address' })
  address: string;

  @Prop({ required: true })
  @ApiProperty({ required: true, description: 'Decimals' })
  decimals: number;

  @Prop({ required: true })
  @ApiProperty({ required: true, description: 'Name' })
  name: string;

  @Prop({ required: true })
  @ApiProperty({ required: true, description: 'Symbol' })
  symbol: string;

  @Prop()
  @ApiProperty({ required: false, description: 'Description' })
  description: string;

  @Prop()
  @ApiProperty({ required: false, description: 'Icon URL' })
  iconUrl: string;
}

export const CoinMetadataSchema = SchemaFactory.createForClass(CoinMetadata);
CoinMetadataSchema.index({ address: 1 }, { unique: true });
CoinMetadataSchema.plugin(MongoosePaginate);
