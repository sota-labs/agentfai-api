import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { LoggerUtils } from 'common/utils/logger.utils';
import Redis from 'ioredis';
import { RedisService } from 'nestjs-redis';

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly logger = LoggerUtils.get(RedisPubSubService.name);
  private publisher: Redis;
  private subscriber: Redis;
  private readonly MAX_LISTENERS = 1000;

  constructor(redisService: RedisService) {
    this.publisher = redisService.getClient();
    this.subscriber = this.publisher.duplicate();
    this.subscriber.setMaxListeners(this.MAX_LISTENERS);
  }

  publish<T>(channel: string, message: T): Promise<number> {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    return this.publisher.publish(channel, messageString);
  }

  unsubscribe(channel: string): void {
    this.logger.info(`Unsubscribing from channel: ${channel}`);
    this.subscriber.unsubscribe(channel);
  }

  subscribe(channel: string, callback: (message: any) => void): () => void {
    this.logger.info(`Subscribing to channel: ${channel}`);
    const messageHandler = (chan: string, msg: string) => {
      if (chan === channel) {
        callback(JSON.parse(msg));
      }
    };

    this.subscriber.subscribe(channel);
    this.subscriber.on('message', messageHandler);

    return () => {
      this.subscriber.removeListener('message', messageHandler);
      this.unsubscribe(channel);
    };
  }

  onModuleDestroy() {
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }
}
