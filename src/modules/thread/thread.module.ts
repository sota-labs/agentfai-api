import { Module } from '@nestjs/common';
import { SharedModule } from 'modules/shared/shared.module';
import { ThreadController } from 'modules/thread/thread.controller';
import { ThreadService } from 'modules/thread/thread.service';
import { ThreadBackendController } from 'modules/thread/thread.backend.controller';
import { AgentModule } from 'modules/agent/agent.module';

@Module({
  imports: [SharedModule, AgentModule],
  controllers: [ThreadController, ThreadBackendController],
  providers: [ThreadService],
  exports: [ThreadService],
})
export class ThreadModule {}
