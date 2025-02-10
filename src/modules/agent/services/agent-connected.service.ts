import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { RedisService } from 'nestjs-redis';
import * as Redis from 'ioredis';
import { AgentConnected, AgentConnectedDocument } from 'modules/agent/schemas/agent-connected.schema';
import { AgentService } from 'modules/agent/services/agent.service';
import { CryptoUtils } from 'common/utils/crypto.utils';
import { LoggerUtils } from 'common/utils/logger.utils';
import { OAuthProvider } from 'modules/shared/providers';
import { RAIDENX_AGENT_ID } from 'modules/agent/agent.constants';

@Injectable()
export class AgentConnectedService {
  private readonly logger = LoggerUtils.get(AgentConnectedService.name);
  private readonly redisClient: Redis.Redis;

  constructor(
    @InjectModel(AgentConnected.name) private agentConnectedModel: Model<AgentConnectedDocument>,
    private readonly jwtService: JwtService,
    private readonly agentService: AgentService,
    private readonly oauthProvider: OAuthProvider,
    private readonly redisService: RedisService,
  ) {
    this.redisClient = this.redisService.getClient();
  }

  private async _getCacheKeyAccessToken(userId: string, agentId: string): Promise<string> {
    return `agent:${userId}:${agentId}:accessToken`;
  }

  private async _getAccessToken(userId: string, agentId: string): Promise<{ accessToken: string; expiresAt: number }> {
    const agentConnected = await this.agentConnectedModel.findOne({ userId, agentId });
    if (!agentConnected) {
      throw new BadRequestException('Agent not connected');
    }

    const now = Math.floor(Date.now() / 1000);
    if (agentConnected.accessTokenExpiresAt < now) {
      this.logger.info(`Access token expired for user ${userId} and agent ${agentId}`);
      return this._refreshAccessToken(agentConnected);
    }

    return {
      accessToken: CryptoUtils.decrypt(agentConnected.accessToken),
      expiresAt: agentConnected.accessTokenExpiresAt,
    };
  }

  private async _refreshAccessToken(
    agentConnected: AgentConnectedDocument,
  ): Promise<{ accessToken: string; expiresAt: number }> {
    this.logger.info(`Refreshing access token for user ${agentConnected.userId} and agent ${agentConnected.agentId}`);

    try {
      const { accessToken, refreshToken } = await this.oauthProvider.refreshAccessToken(agentConnected);

      // update agentConnected
      await this.agentConnectedModel.findOneAndUpdate(
        { userId: agentConnected.userId, agentId: agentConnected.agentId },
        {
          $set: {
            accessToken: CryptoUtils.encrypt(accessToken),
            refreshToken: CryptoUtils.encrypt(refreshToken),
            accessTokenExpiresAt: this.jwtService.decode(accessToken)?.exp ?? 0,
          },
        },
      );

      return { accessToken, expiresAt: this.jwtService.decode(accessToken)?.exp ?? 0 };
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
    const cacheKey = await this._getCacheKeyAccessToken(userId, agentId);
    const cachedAccessToken = await this.redisClient.get(cacheKey);
    if (cachedAccessToken) {
      return cachedAccessToken;
    }

    const { accessToken, expiresAt } = await this._getAccessToken(userId, agentId);
    const expiresIn = Math.min(expiresAt - Math.floor(Date.now() / 1000), 3 * 60); // 3 minutes
    await this.redisClient.set(cacheKey, accessToken, 'EX', expiresIn);
    return accessToken;
  }

  async getAccessTokenFromRaidenX(userId: string): Promise<string> {
    return this.getAccessToken(userId, RAIDENX_AGENT_ID);
  }
}
