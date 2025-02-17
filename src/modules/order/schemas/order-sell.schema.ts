import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';
import { Document } from 'mongoose';
import { Decimal128 } from 'bson';
import MongoosePaginate from 'mongoose-paginate-v2';

export enum OrderSellStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export type OrderSellDocument = OrderSell & Document;

@Schema({ timestamps: true, collection: 'order-sell' })
export class OrderSell {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  poolId: string;

  @Prop({ required: true })
  percent: number;

  @Prop({ required: true })
  amountIn: Decimal128;

  @Prop()
  slippage: number;

  @Prop({ required: true })
  tokenIn: CoinMetadata;

  @Prop({ required: true })
  tokenOut: CoinMetadata;

  @Prop()
  txHash: string;

  @Prop({ required: true })
  txData: string;

  @Prop({ required: true })
  timestamp: number;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  uniqueId: string;
}

export const OrderSellSchema = SchemaFactory.createForClass(OrderSell);
OrderSellSchema.index({ txHash: 1 }, { unique: true, partialFilterExpression: { txHash: { $exists: true } } });
OrderSellSchema.plugin(MongoosePaginate);
