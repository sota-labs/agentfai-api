import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from 'modules/shared/shared.module';
import { User, UserSchema } from 'modules/user/schemas';
import { UserService } from 'modules/user/user.service';

@Module({
  imports: [SharedModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
