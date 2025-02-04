import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MessageService } from 'modules/message/messgae.service';
import { CreateMessageDto } from 'modules/message/dto/create-message.dto';
import { UserId } from 'common/decorators/user-id.decorator';
import { MongoUtils } from 'common/utils/mongo.utils';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MessageThreadResDto } from 'modules/message/dto/res.dto';

@Controller({
  path: 'messages',
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

  @Post('agent-request')
  @ApiOperation({ summary: 'Create a message' })
  @ApiOkResponse({ type: MessageThreadResDto })
  createMessage(@UserId() userId: string, @Body() createMessageDto: CreateMessageDto) {
    return MongoUtils.withTransaction(this.connection, async (session) => {
      return this.messageService.create(userId, createMessageDto, session);
    });
  }
}
