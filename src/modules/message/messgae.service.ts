import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { CreateMessageDto } from 'modules/message/dtos/create-message.dto';
import { Message, MessageDocument } from 'modules/message/messgae.schema';
import { ThreadService } from 'modules/thread/thread.service';
import { AgentService } from 'modules/agent/services/agent.service';
import { MessageStatus } from 'common/constants/agent';
import { AgentWebhookTriggerDto } from 'modules/message/dtos/agent-webhook-trigger.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly threadService: ThreadService,
    private readonly agentService: AgentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  findOne(messageId: string): Promise<MessageDocument> {
    return this.messageModel.findOne({ _id: messageId });
  }

  async create(userId: string, createMessageDto: CreateMessageDto, session: ClientSession): Promise<MessageDocument> {
    const agent = await this.agentService.findOne(createMessageDto.agentId);
    if (!agent) {
      throw new BadRequestException('Agent not found');
    }

    if (!createMessageDto.threadId) {
      const threadName = `Thread ${userId} ${Date.now()}`;
      const thread = await this.threadService.create(userId, threadName, session);
      createMessageDto.threadId = thread._id.toString();
    }

    const [message] = await this.messageModel.create(
      [
        {
          userId,
          ...createMessageDto,
        },
      ],
      { session },
    );
    await this._submitMessageToAgent(message._id.toString(), createMessageDto.question);
    return message;
  }

  private async _submitMessageToAgent(messageId: string, question: string): Promise<any> {
    console.log('question: ', question);
    console.log('messageId: ', messageId);
    // TODO: Call API to get answer
    const rs = await Promise.resolve('AI Agent has received your question and is processing it...');

    return rs;
  }

  async agentWebhookTrigger(agentWebhookTriggerDto: AgentWebhookTriggerDto): Promise<string> {
    const message = await this.messageModel.findById(agentWebhookTriggerDto.messageId);
    if (!message) {
      throw new BadRequestException('Message not found');
    }

    if (message.status !== MessageStatus.PROCESSING) {
      throw new BadRequestException('Message is not processing');
    }

    message.status = MessageStatus.DONE;
    message.answer = agentWebhookTriggerDto.answer;
    await message.save();

    this.eventEmitter.emit('message.created', message);

    return 'Ok';
  }

  async cancelRequest(messageId: string): Promise<string> {
    const message = await this.messageModel.findOne({ _id: messageId });
    if (!message) {
      throw new BadRequestException('Message not found');
    }

    if (message.status !== MessageStatus.PROCESSING) {
      throw new BadRequestException('Message is not processing');
    }

    // Need implement: Call API to cancel request

    message.status = MessageStatus.CANCELLED;
    await message.save();

    return 'Ok';
  }
}
