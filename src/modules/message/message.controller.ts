import { Body, Controller, Param, Post, Put, Sse } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Connection } from 'mongoose';
import { Observable } from 'rxjs';
import { UserId } from 'common/decorators/user-id.decorator';
import { MessageResDto } from 'common/dtos/message.dto';
import { MongoUtils } from 'common/utils/mongo.utils';
import { CreateMessageDto } from 'modules/message/dtos/create-message.dto';
import { MessageThreadResDto } from 'modules/message/dtos/res.dto';
import { MessageService } from 'modules/message/message.service';

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
    return this.messageService.handleSSE(messageId);
  }

  @Put(':messageId/cancel')
  @ApiOperation({ summary: 'Cancel a message' })
  @ApiOkResponse({ type: MessageResDto })
  async cancelRequest(@Param('messageId') messageId: string): Promise<MessageResDto> {
    await this.messageService.cancelRequest(messageId);
    return plainToInstance(MessageResDto, { message: 'Cancel message successfully' });
  }
}
