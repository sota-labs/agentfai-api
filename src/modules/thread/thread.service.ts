import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, PaginateModel, PaginateResult } from 'mongoose';
import { Message, MessageDocument } from 'modules/message/message.schema';
import { Thread, ThreadDocument } from 'modules/thread/thread.schema';
import { IPagination } from 'common/decorators/paginate.decorator';
import { TimeUtils } from 'common/utils/time.utils';

@Injectable()
export class ThreadService {
  constructor(
    @InjectModel(Thread.name) private threadModel: PaginateModel<ThreadDocument>,
    @InjectModel(Message.name) private messageModel: PaginateModel<MessageDocument>,
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
}
