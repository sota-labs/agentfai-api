import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';
import { Document } from 'mongoose';
import { Decimal128 } from 'bson';
import MongoosePaginate from 'mongoose-paginate-v2';

export enum OrderBuyStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export type OrderBuyDocument = OrderBuy & Document;

@Schema({ timestamps: true, collection: 'order-buy' })
export class OrderBuy {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  poolId: string;

  @Prop({ required: true })
  amountIn: Decimal128;

  @Prop()
  slippage: number;

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

export const OrderBuySchema = SchemaFactory.createForClass(OrderBuy);
OrderBuySchema.index({ txHash: 1 }, { unique: true, partialFilterExpression: { txHash: { $exists: true } } });
OrderBuySchema.plugin(MongoosePaginate);
