import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { AgentConnected, AgentConnectedDocument } from 'modules/agent/schemas/agent-connected.schema';
import { AgentService } from 'modules/agent/services/agent.service';
import { CryptoUtils } from 'common/utils/crypto.utils';
import { LoggerUtils } from 'common/utils/logger.utils';

@Injectable()
export class AgentConnectedService {
  private readonly logger = LoggerUtils.get(AgentConnectedService.name);

  constructor(
    @InjectModel(AgentConnected.name) private agentConnectedModel: Model<AgentConnectedDocument>,
    private readonly jwtService: JwtService,
    private readonly agentService: AgentService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private async _refreshAccessToken(agentConnected: AgentConnectedDocument): Promise<string> {
    this.logger.info(`Refreshing access token for user ${agentConnected.userId} and agent ${agentConnected.agentId}`);
    const baseUrl = this.configService.get('raidenx.oauth2Url');
    const url = `${baseUrl}/api/v1/refresh-access-token`;

    const body = {
      clientId: CryptoUtils.decrypt(agentConnected.clientId),
      clientSecret: CryptoUtils.decrypt(agentConnected.clientSecret),
      refreshToken: CryptoUtils.decrypt(agentConnected.refreshToken),
      accessToken: CryptoUtils.decrypt(agentConnected.accessToken),
    };

    try {
      const response = await this.httpService.axiosRef.post(url, body);
      const newAccessToken = response.data.accessToken;
      const newRefreshToken = response.data.refreshToken;

      // update agentConnected
      await this.agentConnectedModel.findOneAndUpdate(
        { userId: agentConnected.userId, agentId: agentConnected.agentId },
        {
          $set: {
            accessToken: CryptoUtils.encrypt(newAccessToken),
            refreshToken: CryptoUtils.encrypt(newRefreshToken),
            accessTokenExpiresAt: this.jwtService.decode(newAccessToken)?.exp ?? 0,
          },
        },
      );

      return newAccessToken;
    } catch (error) {
      this.logger.error(`Error refreshing access token: ${error}`);

      // delete agentConnected
      await this.agentConnectedModel.deleteOne({ userId: agentConnected.userId, agentId: agentConnected.agentId });
      throw new BadRequestException('Agent be not connected');
    }
  }

  async connectAgent(
    userId: string,
    params: { agentId: string; accessToken: string; refreshToken: string; clientId: string; clientSecret: string },
  ): Promise<AgentConnectedDocument> {
    const agent = await this.agentService.findOne(params.agentId);
    if (!agent) {
      throw new BadRequestException('Agent not found');
    }

    const accessTokenEncrypted = CryptoUtils.encrypt(params.accessToken);
    const refreshTokenEncrypted = CryptoUtils.encrypt(params.refreshToken);
    const clientIdEncrypted = CryptoUtils.encrypt(params.clientId);
    const clientSecretEncrypted = CryptoUtils.encrypt(params.clientSecret);

    const agentConnected = await this.agentConnectedModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          agentId: params.agentId,
          accessToken: accessTokenEncrypted,
          refreshToken: refreshTokenEncrypted,
          clientId: clientIdEncrypted,
          clientSecret: clientSecretEncrypted,
          accessTokenExpiresAt: this.jwtService.decode(params.accessToken)?.exp ?? 0,
        },
      },
      { upsert: true, new: true },
    );

    return agentConnected;
  }

  async findByUserId(userId: string): Promise<AgentConnectedDocument[]> {
    return await this.agentConnectedModel.find({ userId });
  }

  async getAccessToken(userId: string, agentId: string): Promise<string> {
    const agentConnected = await this.agentConnectedModel.findOne({ userId, agentId });
    if (!agentConnected) {
      throw new BadRequestException('Agent not connected');
    }

    const now = Math.floor(Date.now() / 1000);
    if (agentConnected.accessTokenExpiresAt < now) {
      this.logger.info(`Access token expired for user ${userId} and agent ${agentId}`);
      return this._refreshAccessToken(agentConnected);
    }

    return CryptoUtils.decrypt(agentConnected.accessToken);
  }
}
