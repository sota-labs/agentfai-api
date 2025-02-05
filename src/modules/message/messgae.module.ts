import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgentModule } from 'modules/agent/agent.module';
import { MessageBackendController } from 'modules/message/messgae.backend.controller';
import { MessageController } from 'modules/message/messgae.controller';
import { MessageService } from 'modules/message/messgae.service';
import { SharedModule } from 'modules/shared/shared.module';
import { ThreadModule } from 'modules/thread/thread.module';
import { ThreadService } from 'modules/thread/thread.service';
@Module({
  imports: [SharedModule, ThreadModule, AgentModule, EventEmitterModule.forRoot()],
  controllers: [MessageController, MessageBackendController],
  providers: [MessageService, ThreadService],
})
export class MessageModule {}
