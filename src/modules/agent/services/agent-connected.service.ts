import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
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
  ) {}

  private async _refreshAccessToken(agentConnected: AgentConnectedDocument): Promise<string> {
    // TODO: Call API to refresh access token
    // TODO: Update access token in database, and return new access token
    this.logger.info(`Refreshing access token for user ${agentConnected.userId} and agent ${agentConnected.agentId}`);
    throw new Error('Not implemented');
  }

  async connectAgent(
    userId: string,
    params: { agentId: string; accessToken: string; refreshToken: string },
  ): Promise<AgentConnectedDocument> {
    const agent = await this.agentService.findOne(params.agentId);
    if (!agent) {
      throw new BadRequestException('Agent not found');
    }

    let accessTokenDecrypted = '';
    let refreshTokenDecrypted = '';
    try {
      accessTokenDecrypted = CryptoUtils.decrypt(params.accessToken);
      refreshTokenDecrypted = CryptoUtils.decrypt(params.refreshToken);
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Invalid token');
    }

    const agentConnected = await this.agentConnectedModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          agentId: params.agentId,
          accessToken: params.accessToken,
          refreshToken: params.refreshToken,
          accessTokenExpiresAt: this.jwtService.decode(accessTokenDecrypted)?.exp ?? 0,
          refreshTokenExpiresAt: this.jwtService.decode(refreshTokenDecrypted)?.exp ?? 0,
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

    return agentConnected.accessToken;
  }
}
