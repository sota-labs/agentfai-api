import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Observable, Subscriber } from 'rxjs';
import { MessageStatus } from 'common/constants/agent';
import { LoggerUtils } from 'common/utils/logger.utils';
import { AgentConnectedService } from 'modules/agent/services/agent-connected.service';
import { AgentService } from 'modules/agent/services/agent.service';
import { AgentWebhookTriggerDto } from 'modules/message/dtos/agent-webhook-trigger.dto';
import { CreateMessageDto } from 'modules/message/dtos/create-message.dto';
import { ISSEData, ISSEMessage } from 'modules/message/message.interface';
import { Message, MessageDocument } from 'modules/message/message.schema';
import { ThreadService } from 'modules/thread/thread.service';
import { RedisPubSubService } from 'common/base/redis-pubsub';
import { ThirdAgentProvider } from 'modules/shared/providers';

@Injectable()
export class MessageService {
  private readonly logger = LoggerUtils.get(MessageService.name);
  private readonly TIMEOUT_AGENT_RESPONSE = 1000 * 60;

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly threadService: ThreadService,
    private readonly agentService: AgentService,
    private readonly agentConnectedService: AgentConnectedService,
    private readonly redisPubSubService: RedisPubSubService,
    private readonly thirdAgentProvider: ThirdAgentProvider,
  ) {}

  async findOne(messageId: string): Promise<MessageDocument> {
    return this.messageModel.findOne({ _id: messageId });
  }

  async create(userId: string, createMessageDto: CreateMessageDto, session: ClientSession): Promise<MessageDocument> {
    let agent;
    let accessToken = null;
    if (createMessageDto.agentId) {
      agent = await this.agentService.findOne(createMessageDto.agentId);
    } else {
      agent = await this.agentService.getAgentDefault();
    }

    if (!agent) {
      throw new BadRequestException('Agent not found');
    }

    if (agent.oauthRequired) {
      accessToken = await this.agentConnectedService.getAccessToken(userId, agent.agentId);
    }

    if (!createMessageDto.threadId) {
      const threadName = `Thread from ${new Date().toLocaleDateString('en-GB')}`;
      const thread = await this.threadService.create(userId, threadName, session);
      createMessageDto.threadId = thread._id.toString();
    }

    const [message] = await this.messageModel.create(
      [
        {
          userId,
          ...createMessageDto,
          agentId: agent.agentId,
          answer: '',
        },
      ],
      { session },
    );
    await this.threadService.incrementTotalMessages(createMessageDto.threadId, agent.agentId, session);

    try {
      await this.thirdAgentProvider.sendMessage({
        agentApiUrl: agent.apiUrl,
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

    this.redisPubSubService.publish(`message.${message._id}`, {
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
    const answer = 'Message has been cancelled';

    message.status = MessageStatus.CANCELLED;
    message.answer = answer;
    await message.save();

    this.redisPubSubService.publish(`message.${message._id}`, {
      answer,
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
  async handleSSE(messageId: string) {
    const message = await this.findOne(messageId);
    if (!message) {
      throw new BadRequestException('Message not found');
    }

    return new Observable<ISSEMessage>((subscriber) => {
      const timeoutId = setTimeout(async () => {
        if (message.status === MessageStatus.PROCESSING) {
          await this._handleTimeoutAgentResponse(message);
        }
      }, this.TIMEOUT_AGENT_RESPONSE);

      // Get message initial
      const initializeMessage = async () => {
        if (message.status !== MessageStatus.PROCESSING) {
          this._streamAnswer(message.answer, subscriber);
        }
      };

      // Listen for event when message is updated
      const listener = (data: ISSEData) => {
        clearTimeout(timeoutId); // Clear timeout when we get a response
        this._streamAnswer(data.answer, subscriber);
      };
      // Subscribe to event
      this.redisPubSubService.subscribe(`message.${messageId}`, (data) => {
        listener(data as unknown as ISSEData);
      });

      initializeMessage();

      // Cleanup
      return () => {
        clearTimeout(timeoutId);
      };
    });
  }

  private _streamAnswer(answer: string, subscriber: Subscriber<ISSEMessage>) {
    const DELAY_TIME = 5;
    const chars = [...answer.split(''), 'DONE'];
    let index = 0;

    const streamInterval = setInterval(() => {
      if (index < chars.length) {
        subscriber.next({
          data: { content: chars[index] },
          type: 'message',
          id: (index + 1).toString(),
        });
        index++;
      } else {
        clearInterval(streamInterval);
        subscriber.complete();
      }
    }, DELAY_TIME);
  }

  private async _handleTimeoutAgentResponse(message: MessageDocument) {
    const answer = 'Something went wrong. Please try again later.';

    await this.messageModel.findByIdAndUpdate(message._id, {
      status: MessageStatus.FAILED,
      answer,
    });

    this.redisPubSubService.publish(`message.${message._id}`, {
      answer,
      status: MessageStatus.FAILED,
    });
  }
}
