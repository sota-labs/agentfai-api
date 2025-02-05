import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { MessageService } from 'modules/message/messgae.service';
import { CreateMessageDto } from 'modules/message/dtos/create-message.dto';
import { UserId } from 'common/decorators/user-id.decorator';
import { MongoUtils } from 'common/utils/mongo.utils';
import { MessageThreadResDto } from 'modules/message/dtos/res.dto';

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
}
