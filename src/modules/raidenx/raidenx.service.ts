import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseProvider } from 'modules/shared/providers/base.provider';
import { LoggerUtils } from 'common/utils/logger.utils';
import { AgentConnectedService } from 'modules/agent/services/agent-connected.service';
import { ApiInsightProvider, ApiWalletsProvider } from 'modules/raidenx/providers';
import { IPositionRes, IUserWallet } from 'modules/raidenx/interfaces';
import { GetPositionsReq } from 'modules/raidenx/dtos/req.dto';
import { IPagination } from 'common/decorators/paginate.decorator';

@Injectable()
export class RaidenxService extends BaseProvider {
  protected logger = LoggerUtils.get(RaidenxService.name);
  protected baseUrl: string;

  constructor(
    httpService: HttpService,
    configService: ConfigService,
    private readonly agentConnectedService: AgentConnectedService,
    private readonly apiWalletsProvider: ApiWalletsProvider,
    private readonly apiInsightProvider: ApiInsightProvider,
  ) {
    super(httpService);
    this.baseUrl = configService.getOrThrow<string>('raidenx.oauth2Url');
  }

  async getAccessToken(userId: string): Promise<string> {
    return this.agentConnectedService.getAccessTokenFromRaidenX(userId);
  }

  async getWallets(userId: string): Promise<IUserWallet[]> {
    const accessToken = await this.getAccessToken(userId);
    return this.apiWalletsProvider.getWallets(accessToken);
  }

  async getPositions(userId: string, params: GetPositionsReq, pagination: IPagination): Promise<IPositionRes[]> {
    const accessToken = await this.getAccessToken(userId);
    return this.apiInsightProvider.getPositions(
      {
        ...params,
        page: pagination.page,
        limit: pagination.limit,
      },
      accessToken,
    );
  }
}
