import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { UserModule } from 'modules/user/user.module';
import { SharedModule } from 'modules/shared/shared.module';
import { OauthGoogleService } from './services/oauth.google.service';

@Module({
  imports: [SharedModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService, OauthGoogleService],
  exports: [AuthService],
})
export class AuthModule {}
