import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ApiKeyAuth } from 'common/decorators/api-key-auth.decorator';
import { Backend } from 'common/decorators/backend.decorator';
import { ApiPaginationQuery, IPagination } from 'common/decorators/paginate.decorator';
import { PaginateMessageResDto } from 'modules/message/dtos/res.dto';
import { ThreadService } from 'modules/thread/thread.service';

@ApiTags('Threads')
@Controller({
  path: '/backend/thread',
  version: '1',
})
export class ThreadBackendController {
  constructor(private readonly threadService: ThreadService) {}

  @Get(':id/messages')
  @Backend()
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Get messages of a specific thread' })
  @ApiOkResponse({ type: PaginateMessageResDto })
  @ApiPaginationQuery()
  async getMessages(@Param('id') id: string, @Query() paginate: IPagination): Promise<PaginateMessageResDto> {
    const messages = await this.threadService.getMessagesByThreadId(id, paginate);
    return plainToInstance(PaginateMessageResDto, messages);
  }
}
