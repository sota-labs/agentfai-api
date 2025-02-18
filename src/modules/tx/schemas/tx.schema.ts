import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Decimal128 } from 'bson';
import { Document } from 'mongoose';
import MongoosePaginate from 'mongoose-paginate-v2';
import { EOrderSide, ETxStatus } from 'common/constants/dex';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';

export type TxDocument = Tx & Document;

export class TxPayload {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  poolId: string;

  @Prop({ required: true })
  tokenIn: CoinMetadata;

  @Prop({ required: true })
  tokenOut: CoinMetadata;
}

@Schema({ timestamps: true, collection: 'tx' })
export class Tx {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  type: EOrderSide;

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
  status: ETxStatus;
}

export const TxSchema = SchemaFactory.createForClass(Tx);
TxSchema.index({ requestId: 1 }, { unique: true });
TxSchema.plugin(MongoosePaginate);
