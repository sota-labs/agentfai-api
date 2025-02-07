import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ClientSession, Model } from 'mongoose';
import { Observable, Subscriber } from 'rxjs';
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
  private readonly TIMEOUT_AGENT_RESPONSE = 1000 * 30;

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
    if (!params.accessToken) {
      // TODO: update logic send to agent default
      // Temporary by pass
      return;
    }

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
    let agent;
    let accessToken = null;
    if (createMessageDto.agentId) {
      [agent, accessToken] = await Promise.all([
        this.agentService.findOne(createMessageDto.agentId),
        this.agentConnectedService.getAccessToken(userId, createMessageDto.agentId),
      ]);
    } else {
      agent = await this.agentService.getAgentDefault();
    }

    if (!agent) {
      throw new BadRequestException('Agent not found');
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
    const answer = 'Message has been cancelled';

    message.status = MessageStatus.CANCELLED;
    message.answer = answer;
    await message.save();

    this.eventEmitter.emit(`message.${message._id}`, {
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
      this.eventEmitter.on(`message.${messageId}`, listener);

      initializeMessage();

      // Cleanup
      return () => {
        clearTimeout(timeoutId);
        this.eventEmitter.removeListener(`message.${messageId}`, listener);
      };
    });
  }

  private _streamAnswer(answer: string, subscriber: Subscriber<ISSEMessage>) {
    const DELAY_TIME = 100;
    const chars = answer.split('');
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

    this.eventEmitter.emit(`message.${message._id}`, {
      answer,
      status: MessageStatus.FAILED,
    });
  }
}
