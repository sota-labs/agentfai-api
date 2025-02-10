import dotenv from 'dotenv';
dotenv.config();

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { SharedModule } from 'modules/shared/shared.module';
import { AgentModule } from 'modules/agent/agent.module';
import { AgentService } from 'modules/agent/services/agent.service';
import { Agent } from 'modules/agent/schemas/agent.schema';
import * as agentJson from './agent.json';

@Module({
  imports: [SharedModule, AgentModule],
})
export class AgentSeederModule {}

async function seedAgents() {
  const app = await NestFactory.create(AgentSeederModule);
  const agentService = app.get(AgentService);
  console.log('Starting to seed agents...');

  const agentsArray = Array.isArray(agentJson) ? agentJson : (agentJson as { default: any[] }).default;
  const agents = plainToInstance(Agent, agentsArray as Array<any>);
  await agentService.bulkWrite(agents);
  console.log('Agents seeded successfully');
}

seedAgents()
  .then(() => {
    console.log('Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding agents:', error);
    process.exit(1);
  });
