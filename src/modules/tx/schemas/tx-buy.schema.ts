import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';
import { Document } from 'mongoose';
import { Decimal128 } from 'bson';
import MongoosePaginate from 'mongoose-paginate-v2';

export enum TxBuyStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export type TxBuyDocument = TxBuy & Document;

@Schema({ timestamps: true, collection: 'tx-buy' })
export class TxBuy {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  poolId: string;

  @Prop({ required: true })
  amountIn: Decimal128;

  @Prop({ required: true })
  tokenIn: CoinMetadata;

  @Prop()
  txHash: string;

  @Prop({ required: true })
  txData: string;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true })
  status: string;
}

export const TxBuySchema = SchemaFactory.createForClass(TxBuy);
TxBuySchema.index({ txHash: 1 }, { unique: true });
TxBuySchema.plugin(MongoosePaginate);
