import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from 'modules/agent/schemas';
import { AGENT_CONFIG } from 'modules/agent/agent.config';
import { LoggerUtils } from 'common/utils/logger.utils';

@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = LoggerUtils.get(AgentService.name);
  constructor(@InjectModel(Agent.name) private agentModel: Model<AgentDocument>) {}

  async onModuleInit() {
    const agents = await this.findAll();
    if (agents.length > 0) return;

    this.logger.info('Creating agents...');
    await this.agentModel.insertMany(AGENT_CONFIG);
    this.logger.info('Agents created successfully');
  }

  async findAll(): Promise<AgentDocument[]> {
    return await this.agentModel.find({});
  }

  async findOne(agentId: string): Promise<AgentDocument | null> {
    return await this.agentModel.findOne({ agentId });
  }

  async findByApiKey(apiKey: string): Promise<AgentDocument | null> {
    return await this.agentModel.findOne({ apiKey });
  }
}
