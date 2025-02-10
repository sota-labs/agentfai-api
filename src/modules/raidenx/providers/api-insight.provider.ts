import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseProvider } from 'modules/shared/providers/base.provider';
import { LoggerUtils } from 'common/utils/logger.utils';
import { IPositionRes } from 'modules/raidenx/interfaces';

@Injectable()
export class ApiInsightProvider extends BaseProvider {
  protected logger = LoggerUtils.get(ApiInsightProvider.name);
  protected baseUrl: string;

  constructor(httpService: HttpService, configService: ConfigService) {
    super(httpService);
    this.baseUrl = configService.getOrThrow<string>('raidenx.insightUrl');
  }

  async getPositions(
    params: { page: number; limit: number; closed?: boolean; isHidden?: boolean; walletAddress?: string },
    accessToken: string,
  ): Promise<IPositionRes[]> {
    const url = `${this.baseUrl}/sui/api/v1/my/positions`;

    const queryParams = {
      page: params.page,
      limit: params.limit,
      ...(params.closed != undefined && { closed: params.closed }),
      ...(params.isHidden != undefined && { isHidden: params.isHidden }),
      ...(params.walletAddress != undefined && { walletAddress: params.walletAddress }),
    };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await this.get(url, headers, queryParams);

    return response;
  }
}
