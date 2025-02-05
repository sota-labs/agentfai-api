import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ClientSession, Model } from 'mongoose';
import { CreateMessageDto } from 'modules/message/dtos/create-message.dto';
import { Message, MessageDocument } from 'modules/message/messgae.schema';
import { ThreadService } from 'modules/thread/thread.service';
import { AgentService } from 'modules/agent/services/agent.service';
import { AgentConnectedService } from 'modules/agent/services/agent-connected.service';
import { AgentDocument } from 'modules/agent/schemas/agent.schema';
import { LoggerUtils } from 'common/utils/logger.utils';

@Injectable()
export class MessageService {
  private readonly logger = LoggerUtils.get(MessageService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly threadService: ThreadService,
    private readonly agentService: AgentService,
    private readonly agentConnectedService: AgentConnectedService,
    private readonly httpService: HttpService,
  ) {}

  private async _sendMessageToAIAgent(agent: AgentDocument, accessToken: string, message: string): Promise<void> {
    const response = await this.httpService.axiosRef.post(
      `${agent.apiUrl}`,
      {
        query: message,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    this.logger.info(`Response from AI agent: ${JSON.stringify(response.data)}`);
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

    await this._sendMessageToAIAgent(agent, accessToken, createMessageDto.question);

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
    return message;
  }
}
