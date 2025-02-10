import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuth } from 'common/decorators/api-key-auth.decorator';
import { Backend } from 'common/decorators/backend.decorator';
import { MessageRoleResDto } from 'modules/message/dtos/res.dto';
import { ThreadService } from 'modules/thread/thread.service';
import { MockMessageReqDto } from 'modules/thread/dtos/req.dto';
import { MessageResDto } from 'common/dtos/message.dto';
import { plainToInstance } from 'class-transformer';

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
  @ApiOkResponse({ type: [MessageRoleResDto] })
  async getMessages(@Param('id') id: string): Promise<MessageRoleResDto[]> {
    const messages = await this.threadService.getMessageRoleByThreadId(id, 20);
    return messages;
  }

  @Post(':id/messages')
  @Backend()
  @ApiKeyAuth()
  @ApiOperation({ summary: 'Mock message for a specific thread' })
  @ApiOkResponse({ type: MessageResDto })
  async mockMessage(
    @Param('id') id: string,
    @Body() body: MockMessageReqDto,
    @Query('accessToken') accessToken: string,
  ): Promise<MessageResDto> {
    await this.threadService.mockMessage(id, body, accessToken);
    return plainToInstance(MessageResDto, { message: 'Mock message successfully' });
  }
}
