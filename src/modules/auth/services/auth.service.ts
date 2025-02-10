import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from 'google-auth-library';
import { OauthGoogleService } from 'modules/auth/services/oauth.google.service';
import { LoginReqDto } from 'modules/auth/dtos/req.dto';
import { LoginResDto } from 'modules/auth/dtos/res.dto';
import { LoggerUtils } from 'common/utils/logger.utils';
import { TAccessTokenPayload, TLoginResponse } from 'common/types/auth.type';
import { User } from 'modules/user/schemas/user.schema';
import { UserService } from 'modules/user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = LoggerUtils.get(AuthService.name);

  constructor(
    private readonly oauthGoogleService: OauthGoogleService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  private async _handleLoginResponse(user: User, payload: TAccessTokenPayload): Promise<TLoginResponse> {
    const accessToken = await this.jwtService.signAsync(
      { userId: user.userId, ...payload },
      { expiresIn: this.configService.getOrThrow<string>('auth.jwt.expiresIn') },
    );
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
      name: payload.name,
    });

    return newUser.toObject();
  }

  async loginGoogle(body: LoginReqDto): Promise<LoginResDto> {
    this.logger.info('Login request received', { body });

    const payload = await this._extractGGLoginPayload(body.idToken);
    const user = await this._constructUserToLogin({ idToken: body.idToken, payload });
    const loginResponse = await this._handleLoginResponse(user, {
      userId: user.userId,
      sub: payload.sub,
      email: payload.email,
    });

    return loginResponse;
  }
}
