import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginTicket, OAuth2Client } from 'google-auth-library';
import { GOOGLE_USERINFO_URL } from 'common/constants/user';
import { TGoogleUserInfo } from 'common/types/auth.type';

@Injectable()
export class OauthGoogleService {
  client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new OAuth2Client();
  }

  async getUserInfo(accessToken: string): Promise<TGoogleUserInfo> {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error.code === HttpStatus.UNAUTHORIZED) {
        throw new UnauthorizedException('Invalid access token.');
      }

      throw new Error(`[getUserInfo] Failed (${res.status}): ${JSON.stringify(data)}`);
    }

    return data as TGoogleUserInfo;
  }

  async verifyIdToken(idToken: string): Promise<LoginTicket> {
    return this.client.verifyIdToken({
      idToken: idToken,
      audience: this.configService.getOrThrow('auth.googleClientId'),
    });
  }
}
