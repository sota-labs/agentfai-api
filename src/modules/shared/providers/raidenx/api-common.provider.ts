import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseProvider } from 'modules/shared/providers/base.provider';
import { LoggerUtils } from 'common/utils/logger.utils';
import { PairDto } from 'common/dtos/raidenx.dto';

@Injectable()
export class ApiCommonProvider extends BaseProvider {
  protected logger = LoggerUtils.get(ApiCommonProvider.name);
  protected baseUrl: string;

  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService);
    this.baseUrl = configService.getOrThrow<string>('raidenx.commonUrl');
  }

  async getPoolInfo(poolId: string): Promise<PairDto> {
    const url = `${this.baseUrl}/api/v1/sui/pairs/${poolId}`;
    const response = await this.get(url);
    return response;
  }
}
