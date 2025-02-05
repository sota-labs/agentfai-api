import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SharedModule } from 'modules/shared/shared.module';
import { MessageController } from 'modules/message/messgae.controller';
import { MessageService } from 'modules/message/messgae.service';
import { ThreadModule } from 'modules/thread/thread.module';
import { ThreadService } from 'modules/thread/thread.service';
import { AgentModule } from 'modules/agent/agent.module';

@Module({
  imports: [
    SharedModule,
    ThreadModule,
    AgentModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [MessageController],
  providers: [MessageService, ThreadService],
})
export class MessageModule {}
