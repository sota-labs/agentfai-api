import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToClass } from 'class-transformer';
import { MessageResDto } from 'modules/message/dto/res.dto';
import { Message } from 'modules/message/messgae.schema';
import { ThreadResDto } from 'modules/thread/dto/res.dto';
import { Thread } from 'modules/thread/thread.schema';
import { ClientSession, Model } from 'mongoose';

@Injectable()
export class ThreadService {
  constructor(
    @InjectModel(Thread.name) private threadModel: Model<Thread>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async create(userId: string, name: string, session: ClientSession) {
    const [thread] = await this.threadModel.create(
      [
        {
          userId,
          name,
        },
      ],
      { session },
    );
    return plainToClass(ThreadResDto, thread);
  }

  async getThreads(userId: string) {
    const rs = await this.threadModel.find({ userId });
    return plainToClass(ThreadResDto, rs);
  }

  async getThread(userId: string, _id: string) {
    const messages = await this.messageModel.find({ threadId: _id });
    const thread = await this.threadModel.findOne({ _id, userId });

    return {
      ...plainToClass(ThreadResDto, thread),
      messages: plainToClass(MessageResDto, messages),
    };
  }

  async deleteThread(userId: string, _id: string): Promise<string> {
    await this.threadModel.deleteOne({ _id, userId });
    return `Thread ${_id} deleted successfully`;
  }
}
