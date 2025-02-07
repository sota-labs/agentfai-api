import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LoggerUtils } from 'common/utils/logger.utils';
import { BaseProvider } from 'modules/shared/providers/base.provider';
import { AgentConnectedDocument } from 'modules/agent/schemas';
import { CryptoUtils } from 'common/utils/crypto.utils';

@Injectable()
export class OAuthProvider extends BaseProvider {
  protected logger = LoggerUtils.get(OAuthProvider.name);
  protected baseUrl: string;

  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService);
    this.baseUrl = configService.getOrThrow<string>('raidenx.oauth2Url');
  }

  async refreshAccessToken(
    agentConnected: AgentConnectedDocument,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const url = `${this.baseUrl}/api/v1/refresh-access-token`;
    const body = {
      clientId: CryptoUtils.decrypt(agentConnected.clientId),
      clientSecret: CryptoUtils.decrypt(agentConnected.clientSecret),
      refreshToken: CryptoUtils.decrypt(agentConnected.refreshToken),
      accessToken: CryptoUtils.decrypt(agentConnected.accessToken),
    };

    const response = await this.post(url, {}, body);

    return response;
  }
}
