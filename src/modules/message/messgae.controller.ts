import { Body, Controller, Param, Post, Put, Sse } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UserId } from 'common/decorators/user-id.decorator';
import { MongoUtils } from 'common/utils/mongo.utils';
import { CreateMessageDto } from 'modules/message/dtos/create-message.dto';
import { MessageThreadResDto } from 'modules/message/dtos/res.dto';
import { MessageService } from 'modules/message/messgae.service';
import { Connection } from 'mongoose';
import { Observable } from 'rxjs';

@Controller({
  path: 'message',
  version: '1',
})
@ApiTags('Messages')
@ApiBearerAuth()
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a message' })
  @ApiOkResponse({ type: MessageThreadResDto })
  async create(@UserId() userId: string, @Body() createMessageDto: CreateMessageDto): Promise<MessageThreadResDto> {
    return MongoUtils.withTransaction(this.connection, async (session) => {
      const message = await this.messageService.create(userId, createMessageDto, session);
      return plainToInstance(MessageThreadResDto, message);
    });
  }

  @Sse('sse/:messageId')
  async sse(@Param('messageId') messageId: string): Promise<Observable<any>> {
    return this.messageService.hanldeSSE(messageId);
  }

  @Put(':messageId/cancel')
  @ApiOperation({ summary: 'Cancel a message' })
  @ApiOkResponse({ schema: { type: 'string', example: 'Ok' } })
  async cancelRequest(@Param('messageId') messageId: string): Promise<string> {
    return this.messageService.cancelRequest(messageId);
  }
}
