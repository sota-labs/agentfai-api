import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseProvider } from 'modules/shared/providers/base.provider';
import { LoggerUtils } from 'common/utils/logger.utils';
import { IUserWallet } from 'modules/raidenx/interfaces';

@Injectable()
export class ApiWalletsProvider extends BaseProvider {
  protected logger = LoggerUtils.get(ApiWalletsProvider.name);
  protected baseUrl: string;

  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService);
    this.baseUrl = configService.getOrThrow<string>('raidenx.walletsUrl');
  }

  async getWallets(accessToken: string): Promise<IUserWallet[]> {
    const url = `${this.baseUrl}/api/v1/sui/user-wallets`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    return await this.get(url, headers);
  }
}
