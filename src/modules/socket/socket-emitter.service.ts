import { Injectable } from '@nestjs/common';
import { Emitter } from '@socket.io/redis-emitter';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { LoggerUtils } from 'common/utils/logger.utils';
import { EAgentAction } from 'common/constants/agent';

@Injectable()
export class SocketEmitterService {
  private readonly emitter: Emitter;
  private readonly logger = LoggerUtils.get(SocketEmitterService.name);
  private readonly redisClient: RedisClientType;

  constructor(configService: ConfigService) {
    this.redisClient = createClient({
      url: `redis://${configService.getOrThrow<string>('redis.host')}:${configService.getOrThrow<number>('redis.port')}`,
    });

    this.redisClient.connect().catch((err) => {
      this.logger.error('Redis Client Connection Error', err);
    });

    this.emitter = new Emitter(this.redisClient);
  }

  public emit<T>(event: string, data: T): void {
    this.emitter.emit(event, data);
  }

  public emitActionWebhookTrigger(userId: string, payload: { action: EAgentAction; agentId: string }): void {
    this.emitter.to(`userId_${userId}`).emit('agent_action_trigger', payload);
  }
}
