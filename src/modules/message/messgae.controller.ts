import { BadRequestException, Body, Controller, Param, Post, Put, Sse } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { MessageStatus } from 'common/constants/agent';
import { UserId } from 'common/decorators/user-id.decorator';
import { MongoUtils } from 'common/utils/mongo.utils';
import { AgentWebhookTriggerDto } from 'modules/message/dtos/agent-webhook-trigger.dto';
import { CreateMessageDto } from 'modules/message/dtos/create-message.dto';
import { MessageThreadResDto } from 'modules/message/dtos/res.dto';
import { MessageService } from 'modules/message/messgae.service';
import { Connection } from 'mongoose';
import { Observable } from 'rxjs';

interface SSEMessage {
  data: { content: string };
  type: string;
  id: string;
}

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
  async sse(@Param('messageId') messageId: string): Promise<Observable<SSEMessage>> {
    return new Observable<SSEMessage>((subscriber) => {
      const checkMessage = async () => {
        const message = await this.messageService.findOne(messageId);
        if (!message) {
          subscriber.error(new BadRequestException('Message not found'));
          return;
        }

        let messAnswer = '';
        if (message.status === MessageStatus.DONE) {
          messAnswer = message.answer;
        }

        if (message.status === MessageStatus.CANCELLED) {
          messAnswer = 'Message cancelled';
        }

        if (messAnswer) {
          const chars = messAnswer.split('');
          let index = 0;

          const streamInterval = setInterval(() => {
            if (index < chars.length) {
              subscriber.next({
                data: { content: chars[index] },
                type: 'message',
                id: String(index + 1),
              });
              index++;
            } else {
              clearInterval(streamInterval);
              subscriber.complete();
            }
          }, 100);
        }
      };

      const pollInterval = setInterval(checkMessage, 1000);

      return () => {
        clearInterval(pollInterval);
      };
    });
  }

  @Post('agent-webhook-trigger')
  @ApiProperty({ type: AgentWebhookTriggerDto })
  @ApiOperation({ summary: 'Webhook trigger an agent' })
  @ApiOkResponse({ schema: { type: 'string', example: 'Ok' } })
  async agentWebhookTrigger(@Body() agentWebhookTriggerDto: AgentWebhookTriggerDto): Promise<string> {
    return this.messageService.agentWebhookTrigger(agentWebhookTriggerDto);
  }

  @Put(':messageId/cancel')
  @ApiOperation({ summary: 'Cancel a message' })
  @ApiOkResponse({ schema: { type: 'string', example: 'Ok' } })
  async cancelRequest(@Param('messageId') messageId: string): Promise<string> {
    return this.messageService.cancelRequest(messageId);
  }
}
