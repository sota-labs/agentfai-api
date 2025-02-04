import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToClass } from 'class-transformer';
import { CreateMessageDto } from 'modules/message/dto/create-message.dto';
import { MessageThreadResDto } from 'modules/message/dto/res.dto';
import { Message } from 'modules/message/messgae.schema';
import { Thread } from 'modules/thread/thread.schema';
import { ThreadService } from 'modules/thread/thread.service';
import { ClientSession, Model } from 'mongoose';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Thread.name) private threadModel: Model<Thread>,
    private readonly threadService: ThreadService,
  ) {}

  async create(userId: string, createMessageDto: CreateMessageDto, session: ClientSession) {
    if (!createMessageDto.threadId) {
      const threadName = `Thread ${userId} ${Date.now()}`;
      const thread = await this.threadService.create(userId, threadName, session);
      createMessageDto.threadId = thread._id.toString();
    }

    // TODO: Call API to get answer
    const answer = await new Promise((rs) => {
      setTimeout(() => {
        rs(`Answer with current time ${Date.now()}`);
      }, 500);
    });

    const [message] = await this.messageModel.create(
      [
        {
          ...createMessageDto,
          answer,
        },
      ],
      { session },
    );
    return plainToClass(MessageThreadResDto, message);
  }
}
