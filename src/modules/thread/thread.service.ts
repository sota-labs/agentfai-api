import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { ClientSession, PaginateModel, PaginateResult } from 'mongoose';
import { Message, MessageDocument } from 'modules/message/message.schema';
import { Thread, ThreadDocument } from 'modules/thread/thread.schema';
import { IPagination } from 'common/decorators/paginate.decorator';
import { TimeUtils } from 'common/utils/time.utils';
import { MessageRoleResDto } from 'modules/message/dtos/res.dto';
import { MockMessageReqDto } from 'modules/thread/dtos/req.dto';
import { AgentService } from 'modules/agent/services/agent.service';
import { LoggerUtils } from 'common/utils/logger.utils';

@Injectable()
export class ThreadService {
  private readonly logger = LoggerUtils.get(ThreadService.name);
  constructor(
    @InjectModel(Thread.name) private threadModel: PaginateModel<ThreadDocument>,
    @InjectModel(Message.name) private messageModel: PaginateModel<MessageDocument>,
    private readonly jwtService: JwtService,
    private readonly agentService: AgentService,
    private readonly httpService: HttpService,
  ) {}

  async create(userId: string, name: string, session: ClientSession): Promise<ThreadDocument> {
    const [thread] = await this.threadModel.create(
      [
        {
          userId,
          name,
          activeAgentId: '',
          totalMessages: 0,
          lastViewedAt: TimeUtils.nowInSeconds(),
        },
      ],
      { session },
    );
    return thread;
  }

  async paginate(userId: string, paginate: IPagination): Promise<PaginateResult<ThreadDocument>> {
    const rs = await this.threadModel.paginate({ userId }, { ...paginate, sort: { createdAt: -1 } });
    return rs;
  }

  async getDetailsByThreadId(userId: string, _id: string): Promise<ThreadDocument> {
    const thread = await this.threadModel.findOneAndUpdate(
      { _id, userId },
      { $set: { lastViewedAt: TimeUtils.nowInSeconds() } },
      { new: true },
    );
    return thread;
  }

  async getMessagesByThreadId(
    threadId: string,
    paginate: IPagination,
    userId?: string,
  ): Promise<PaginateResult<MessageDocument>> {
    const messages = await this.messageModel.paginate(
      { threadId, ...(userId ? { userId } : {}) },
      { ...paginate, sort: { createdAt: -1 } },
    );
    return messages;
  }

  async delete(userId: string, _id: string): Promise<void> {
    await this.threadModel.deleteOne({ _id, userId });
  }

  async incrementTotalMessages(threadId: string, toAgentId: string, session: ClientSession): Promise<ThreadDocument> {
    const thread = await this.threadModel.findOneAndUpdate(
      { _id: threadId },
      { $inc: { totalMessages: 1 }, $set: { activeAgentId: toAgentId } },
      { session, new: true },
    );
    return thread;
  }

  async getMessageRoleByThreadId(threadId: string, size: number = 20): Promise<MessageRoleResDto[]> {
    const messages = await this.messageModel.find({ threadId }, null, { sort: { createdAt: -1 }, limit: size });

    const result = [];
    messages.forEach((message) => {
      if (message.answer) {
        result.push({
          role: 'assistant',
          content: message.answer,
          agentId: message.agentId,
          createdAt: Math.floor(message.updatedAt.getTime() / 1000),
          updatedAt: Math.floor(message.updatedAt.getTime() / 1000),
        });
      }

      result.push({
        role: 'user',
        content: message.question,
        agentId: null,
        createdAt: Math.floor(message.createdAt.getTime() / 1000),
        updatedAt: Math.floor(message.createdAt.getTime() / 1000),
      });
    });
    return result;
  }

  async mockMessage(threadId: string, data: MockMessageReqDto, accessToken: string): Promise<void> {
    const [message] = await this.messageModel.create([
      {
        threadId,
        userId: this.jwtService.decode(accessToken)?.userId ?? 'faker',
        question: data.question,
        answer: '',
        agentId: data.agentId,
      },
    ]);

    const agent = await this.agentService.findOne(data.agentId);
    if (!agent) {
      throw new BadRequestException('Agent not found');
    }

    const body = {
      content: data.question,
      message_id: message._id.toString(),
      thread_id: threadId,
    };

    const headers = { Authorization: `Bearer ${accessToken}` };

    const response = await this.httpService.axiosRef.post(`${agent.apiUrl}`, body, { headers });

    this.logger.info(`Response from AI agent: ${JSON.stringify(response.data)}`);
  }
}
