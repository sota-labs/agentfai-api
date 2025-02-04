import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentController } from 'modules/agent/agent.controller';
import { AgentService } from 'modules/agent/services/agent.service';
import { AgentConnectedService } from 'modules/agent/services/agent-connected.service';
import { Agent, AgentConnected, AgentConnectedSchema, AgentSchema } from 'modules/agent/schemas';
import { SharedModule } from 'modules/shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      { name: Agent.name, schema: AgentSchema },
      { name: AgentConnected.name, schema: AgentConnectedSchema },
    ]),
  ],
  providers: [AgentService, AgentConnectedService],
  exports: [AgentService, AgentConnectedService],
  controllers: [AgentController],
})
export class AgentModule {}
