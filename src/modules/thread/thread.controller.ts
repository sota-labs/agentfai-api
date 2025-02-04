import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, OmitType } from '@nestjs/swagger';
import { UserId } from 'common/decorators/user-id.decorator';
import { ThreadResDto } from 'modules/thread/dto/res.dto';
import { ThreadService } from 'modules/thread/thread.service';

@ApiTags('Threads')
@Controller({
  path: 'thread',
  version: '1',
})
@ApiBearerAuth()
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Get()
  @ApiOperation({ summary: 'Get all threads for user' })
  @ApiOkResponse({
    description: 'List of threads retrieved successfully',
    type: [OmitType(ThreadResDto, ['messages'])],
  })
  getThreads(@UserId() userId: string) {
    return this.threadService.getThreads(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific thread' })
  @ApiOkResponse({ type: ThreadResDto })
  getThread(@UserId() userId: string, @Param('id') id: string) {
    return this.threadService.getThread(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a thread' })
  @ApiOkResponse({
    description: 'Thread :id deleted successfully',
    schema: {
      type: 'string',
      example: 'Thread 66b000000000000000000000 deleted successfully',
    },
  })
  deleteThread(@UserId() userId: string, @Param('id') id: string) {
    return this.threadService.deleteThread(userId, id);
  }
}
