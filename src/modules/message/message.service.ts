import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ClientSession, Model } from 'mongoose';
import { Observable } from 'rxjs';
import { CreateMessageDto } from 'modules/message/dtos/create-message.dto';
import { ISSEData, ISSEMessage } from 'modules/message/message.interface';
import { Message, MessageDocument } from 'modules/message/message.schema';
import { ThreadService } from 'modules/thread/thread.service';
import { AgentService } from 'modules/agent/services/agent.service';
import { AgentConnectedService } from 'modules/agent/services/agent-connected.service';
import { AgentDocument } from 'modules/agent/schemas/agent.schema';
import { LoggerUtils } from 'common/utils/logger.utils';
import { MessageStatus } from 'common/constants/agent';
import { AgentWebhookTriggerDto } from 'modules/message/dtos/agent-webhook-trigger.dto';

@Injectable()
export class MessageService {
  private readonly logger = LoggerUtils.get(MessageService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly threadService: ThreadService,
    private readonly agentService: AgentService,
    private readonly eventEmitter: EventEmitter2,
    private readonly agentConnectedService: AgentConnectedService,
    private readonly httpService: HttpService,
  ) {}

  private async _sendMessageToAIAgent(
    agent: AgentDocument,
    params: {
      accessToken?: string;
      message: string;
      messageId: string;
      threadId: string;
    },
  ): Promise<void> {
    const body = {
      content: params.message,
      message_id: params.messageId,
      thread_id: params.threadId,
    };

    const headers = params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {};

    const response = await this.httpService.axiosRef.post(`${agent.apiUrl}`, body, { headers });

    this.logger.info(`Response from AI agent: ${JSON.stringify(response.data)}`);
  }

  async findOne(messageId: string): Promise<MessageDocument> {
    return this.messageModel.findOne({ _id: messageId });
  }

  async create(userId: string, createMessageDto: CreateMessageDto, session: ClientSession): Promise<MessageDocument> {
    const [agent, accessToken] = await Promise.all([
      this.agentService.findOne(createMessageDto.agentId),
      this.agentConnectedService.getAccessToken(userId, createMessageDto.agentId),
    ]);

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
          answer: '',
        },
      ],
      { session },
    );
    await this.threadService.incrementTotalMessages(createMessageDto.threadId, agent.agentId, session);

    try {
      await this._sendMessageToAIAgent(agent, {
        accessToken,
        message: createMessageDto.question,
        messageId: message._id.toString(),
        threadId: createMessageDto.threadId,
      });
    } catch (error) {
      this.logger.error(`Error sending message to AI agent: ${error}`);
      throw new BadRequestException('Agent is not available');
    }
    return message;
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

    this.eventEmitter.emit(`message.${message._id}`, {
      answer: agentWebhookTriggerDto.answer,
      status: MessageStatus.DONE,
    });

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

    this.eventEmitter.emit(`message.${message._id}`, {
      answer: 'Request cancelled',
      status: MessageStatus.CANCELLED,
    });

    return 'Ok';
  }

  /**
   * Handle SSE
   * @param messageId
   * @returns
   *
   * Step 1: Get message initial
   * Step 2: Stream answer if message has answer
   * Step 3: If don't have answer, subscribe to event => stream answer when message is updated
   * Step 4: Cleanup
   */
  async hanldeSSE(messageId: string) {
    return new Observable<ISSEMessage>((subscriber) => {
      // Get message initial
      const initializeMessage = async () => {
        const message = await this.findOne(messageId);
        if (!message) {
          subscriber.error(new BadRequestException('Message not found'));
          return;
        }

        // If message has answer
        if (message.status === MessageStatus.DONE) {
          streamAnswer(message.answer);
        } else if (message.status === MessageStatus.CANCELLED) {
          streamAnswer('Message cancelled');
        }
      };

      // Function to stream each character
      const streamAnswer = (answer: string) => {
        const chars = answer.split('');
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
      };

      // Listen for event when message is updated
      const listener = (data: ISSEData) => {
        streamAnswer(data.answer);
      };

      // Subscribe to event
      this.eventEmitter.on(`message.${messageId}`, listener);

      initializeMessage();

      // Cleanup
      return () => {
        this.eventEmitter.removeListener(`message.${messageId}`, listener);
      };
    });
  }
}
