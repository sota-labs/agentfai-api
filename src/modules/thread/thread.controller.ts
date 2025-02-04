import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserId } from 'common/decorators/user-id.decorator';
import { ThreadService } from 'modules/thread/thread.service';

@ApiTags('Threads')
@Controller('threads')
@ApiBearerAuth()
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Get()
  getThreads(@UserId() userId: string) {
    return this.threadService.getThreads(userId);
  }

  @Get(':id')
  getThread(@UserId() userId: string, @Param('id') id: string) {
    return this.threadService.getThread(userId, id);
  }

  @Delete(':id')
  deleteThread(@UserId() userId: string, @Param('id') id: string) {
    return this.threadService.deleteThread(userId, id);
  }
}
