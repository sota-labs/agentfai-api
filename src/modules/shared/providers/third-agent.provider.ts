import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { LogExecutionTime, LoggerUtils } from 'common/utils/logger.utils';
import { BaseProvider } from 'modules/shared/providers/base.provider';

@Injectable()
export class ThirdAgentProvider extends BaseProvider {
  protected logger = LoggerUtils.get(ThirdAgentProvider.name);
  constructor(httpService: HttpService) {
    super(httpService);
  }

  @LogExecutionTime()
  async sendMessage(params: {
    agentApiUrl: string;
    accessToken?: string;
    message: string;
    messageId: string;
    threadId: string;
  }): Promise<void> {
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

    await this.post(`${params.agentApiUrl}`, headers, body);
  }
}
