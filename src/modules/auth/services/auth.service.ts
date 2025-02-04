import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from 'google-auth-library';
import { OauthGoogleService } from './oauth.google.service';
import { LoginReqDto } from '../dtos/req.dto';
import { LoginResDto } from '../dtos/res.dto';
import { LoggerUtils } from 'common/utils/logger.utils';
import { TAccessTokenPayload, TLoginResponse } from 'common/types/auth.type';
import { User } from 'modules/user/user.schema';
import { UserService } from 'modules/user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = LoggerUtils.get(AuthService.name);

  constructor(
    private readonly oauthGoogleService: OauthGoogleService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  private async _handleLoginResponse(user: User, payload: TAccessTokenPayload): Promise<TLoginResponse> {
    const accessToken = await this.jwtService.signAsync({ userId: user.userId, ...payload });
    return {
      accessToken,
      salt: user.salt,
    };
  }

  private async _extractGGLoginPayload(idToken: string): Promise<TokenPayload> {
    const ticket = await this.oauthGoogleService.verifyIdToken(idToken);

    const payload = ticket?.getPayload();
    if (!payload) throw new Error('Invalid token: payload is empty');

    return payload;
  }

  private async _constructUserToLogin({ idToken, payload }: { idToken: string; payload: TokenPayload }): Promise<User> {
    const user = await this.userService.findOneByUserId(payload.sub);
    if (user) return user.toObject();

    const newUser = await this.userService.create({
      idToken,
      sub: payload.sub,
    });

    return newUser.toObject();
  }

  async loginGoogle(body: LoginReqDto): Promise<LoginResDto> {
    this.logger.info('Login request received', { body });

    const payload = await this._extractGGLoginPayload(body.idToken);
    const user = await this._constructUserToLogin({ idToken: body.idToken, payload });
    const loginResponse = await this._handleLoginResponse(user, payload);

    return loginResponse;
  }
}
