import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, PaginateModel, PaginateResult } from 'mongoose';
import { Message, MessageDocument } from 'modules/message/messgae.schema';
import { Thread, ThreadDocument } from 'modules/thread/thread.schema';
import { IPagination } from 'common/decorators/paginate.decorator';

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
    const thread = await this.threadModel.findOne({ _id, userId });
    return thread;
  }

  async getMessagesByThreadId(
    userId: string,
    _id: string,
    paginate: IPagination,
  ): Promise<PaginateResult<MessageDocument>> {
    const messages = await this.messageModel.paginate(
      { threadId: _id, userId },
      { ...paginate, sort: { createdAt: -1 } },
    );
    return messages;
  }

  async delete(userId: string, _id: string): Promise<void> {
    await this.threadModel.deleteOne({ _id, userId });
  }
}
