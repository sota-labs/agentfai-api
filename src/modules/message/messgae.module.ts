import { Module } from '@nestjs/common';
import { SharedModule } from 'modules/shared/shared.module';
import { MessageController } from 'modules/message/messgae.controller';
import { MessageService } from 'modules/message/messgae.service';
import { ThreadModule } from 'modules/thread/thread.module';
import { ThreadService } from 'modules/thread/thread.service';

@Module({
  imports: [SharedModule, ThreadModule],
  controllers: [MessageController],
  providers: [MessageService, ThreadService],
})
export class MessageModule {}
