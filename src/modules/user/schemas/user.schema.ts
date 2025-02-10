import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import MongoosePaginate from 'mongoose-paginate-v2';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  constructor(user: User) {
    Object.assign(this, user);
  }

  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  zkAddress: string;

  @Prop({ default: null })
  name?: string;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ required: true })
  salt: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ userId: 1 }, { unique: true });
UserSchema.index({ zkAddress: 1 }, { unique: true });
UserSchema.plugin(MongoosePaginate);
