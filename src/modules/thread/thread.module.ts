import { Module } from '@nestjs/common';
import { SharedModule } from 'modules/shared/shared.module';
import { ThreadController } from 'modules/thread/thread.controller';
import { ThreadService } from 'modules/thread/thread.service';

@Module({
  imports: [SharedModule],
  controllers: [ThreadController],
  providers: [ThreadService],
  exports: [ThreadService],
})
export class ThreadModule {}
