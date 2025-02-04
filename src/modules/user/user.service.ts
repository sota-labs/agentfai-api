import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { jwtToAddress } from '@mysten/sui/zklogin';
import { ClientSession, Model } from 'mongoose';
import { customAlphabet } from 'nanoid/non-secure';
import { User, UserDocument } from './user.schema';
import { generateSalt } from 'common/utils/zklogin.utils';

const customNanoId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789abcdefghijklmnopqrstuvwxyz', 8);

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: { idToken: string; sub: string }, session?: ClientSession): Promise<UserDocument> {
    const { idToken, sub } = data;
    const salt = generateSalt();

    const [user] = await this.userModel.create(
      [
        {
          userId: sub,
          name: `User #${customNanoId(8)}`,
          salt,
          zkAddress: jwtToAddress(idToken, salt),
        },
      ],
      { session },
    );

    return user;
  }

  async findOneByZkAddress(zkAddress: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ zkAddress });
  }

  async findOneByUserId(userId: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ userId });
  }
}
