import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from 'nestjs-redis';
import { LoggerUtils } from 'common/utils/logger.utils';

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

  publish<T>(channel: string, message: T): void {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    this.publisher.publish(channel, messageString);
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    this.logger.info(`Subscribing to channel: ${channel}`);
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (chan, msg) => {
      if (chan === channel) {
        callback(JSON.parse(msg));
      }
    });
  }

  unsubscribe(channel: string): void {
    this.logger.info(`Unsubscribing from channel: ${channel}`);
    this.subscriber.unsubscribe(channel);
  }

  onModuleDestroy() {
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }
}
