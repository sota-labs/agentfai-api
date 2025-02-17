import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Decimal128 } from 'bson';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';
import { Document } from 'mongoose';
import MongoosePaginate from 'mongoose-paginate-v2';

export enum TxType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum TxStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export type TxDocument = Tx & Document;

export class TxPayload {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  poolId: string;

  @Prop({ required: true })
  tokenIn: CoinMetadata;
}

@Schema({ timestamps: true, collection: 'tx' })
export class Tx {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: TxType;

  @Prop({ required: true })
  requestId: string;

  @Prop()
  payload: TxPayload;

  @Prop()
  txData: string;

  @Prop()
  txHash: string;

  @Prop()
  amountIn: Decimal128;

  @Prop()
  amountOut: Decimal128;

  @Prop({ required: true })
  status: TxStatus;
}

export const TxSchema = SchemaFactory.createForClass(Tx);
TxSchema.index({ requestId: 1 }, { unique: true });
TxSchema.plugin(MongoosePaginate);
