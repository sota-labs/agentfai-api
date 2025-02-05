import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { CreateMessageDto } from 'modules/message/dtos/create-message.dto';
import { Message, MessageDocument } from 'modules/message/messgae.schema';
import { ThreadService } from 'modules/thread/thread.service';
import { AgentService } from 'modules/agent/services/agent.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly threadService: ThreadService,
    private readonly agentService: AgentService,
  ) {}

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

    // TODO: Call API to get answer
    const answer = await new Promise((rs) => {
      setTimeout(() => {
        rs(`Answer with current time ${Date.now()}`);
      }, 500);
    });

    const [message] = await this.messageModel.create(
      [
        {
          userId,
          ...createMessageDto,
          answer,
        },
      ],
      { session },
    );
    return message;
  }
}
