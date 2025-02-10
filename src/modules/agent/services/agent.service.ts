import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from 'modules/agent/schemas';
import { LoggerUtils } from 'common/utils/logger.utils';

@Injectable()
export class AgentService {
  private readonly logger = LoggerUtils.get(AgentService.name);
  constructor(@InjectModel(Agent.name) private agentModel: Model<AgentDocument>) {}

  async findAll(): Promise<AgentDocument[]> {
    return await this.agentModel.find({});
  }

  async findOne(agentId: string): Promise<AgentDocument | null> {
    return await this.agentModel.findOne({ agentId });
  }

  async findByApiKey(apiKey: string): Promise<AgentDocument | null> {
    return await this.agentModel.findOne({ apiKey });
  }

  async bulkWrite(agents: Agent[]): Promise<void> {
    await this.agentModel.bulkWrite(
      agents.map((agent) => ({
        updateOne: {
          filter: { agentId: agent.agentId },
          update: { $set: agent },
          upsert: true,
        },
      })),
    );
  }

  async getAgentDefault(): Promise<AgentDocument> {
    const agent = await this.agentModel.findOne({ oauthRequired: false });
    if (!agent) {
      throw new BadRequestException('Agent default not found');
    }
    return agent;
  }
}
