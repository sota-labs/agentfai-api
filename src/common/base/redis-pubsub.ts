import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from 'nestjs-redis';

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;

  constructor(redisService: RedisService) {
    this.publisher = redisService.getClient();
    this.subscriber = this.publisher.duplicate();
  }

  async publish<T>(channel: string, message: T): Promise<number> {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    return this.publisher.publish(channel, messageString);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (chan, msg) => {
      if (chan === channel) {
        callback(JSON.parse(msg));
      }
    });
  }

  onModuleDestroy() {
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }
}
