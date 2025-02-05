import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ApiPaginationQuery, IPagination } from 'common/decorators/paginate.decorator';
import { UserId } from 'common/decorators/user-id.decorator';
import { MessageResDto } from 'common/dtos/message.dto';
import { PaginateMessageResDto } from 'modules/message/dtos/res.dto';
import { PaginateThreadResDto, ThreadResDto } from 'modules/thread/dtos/res.dto';
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
    type: PaginateThreadResDto,
  })
  @ApiPaginationQuery()
  async getThreads(@UserId() userId: string, @Query() paginate: IPagination): Promise<PaginateThreadResDto> {
    const rs = await this.threadService.paginate(userId, paginate);
    return plainToInstance(PaginateThreadResDto, rs);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific thread' })
  @ApiOkResponse({ type: ThreadResDto })
  async getThread(@UserId() userId: string, @Param('id') id: string): Promise<ThreadResDto> {
    const thread = await this.threadService.getDetailsByThreadId(userId, id);
    return plainToInstance(ThreadResDto, thread);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages of a specific thread' })
  @ApiOkResponse({ type: PaginateMessageResDto })
  async getMessages(@UserId() userId: string, @Param('id') id: string): Promise<PaginateMessageResDto> {
    const messages = await this.threadService.getMessagesByThreadId(userId, id);
    console.log('messages: ', messages);
    return plainToInstance(PaginateMessageResDto, messages);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a thread' })
  @ApiOkResponse({
    description: 'Thread :id deleted successfully',
    type: MessageResDto,
  })
  async deleteThread(@UserId() userId: string, @Param('id') id: string): Promise<MessageResDto> {
    await this.threadService.delete(userId, id);
    return plainToInstance(MessageResDto, { message: 'Thread deleted successfully' });
  }
}
