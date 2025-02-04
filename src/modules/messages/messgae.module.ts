import { Module } from '@nestjs/common';
import { SharedModule } from 'modules/shared/shared.module';
import { MessageController } from 'modules/messages/messgae.controller';
import { MessageService } from 'modules/messages/messgae.service';
import { ThreadModule } from 'modules/threads/thread.module';
import { ThreadService } from 'modules/threads/thread.service';

@Module({
  imports: [SharedModule, ThreadModule],
  controllers: [MessageController],
  providers: [MessageService, ThreadService],
})
export class MessageModule {}
