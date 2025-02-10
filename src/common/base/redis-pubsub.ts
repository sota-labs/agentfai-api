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
    this.subscriber.setMaxListeners(20);
  }

  async publish<T>(channel: string, message: T): Promise<number> {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    return this.publisher.publish(channel, messageString);
  }

  subscribe(channel: string, callback: (message: any) => void): () => void {
    const messageHandler = (chan: string, msg: string) => {
      if (chan === channel) {
        callback(JSON.parse(msg));
      }
    };

    this.subscriber.subscribe(channel);
    this.subscriber.on('message', messageHandler);

    return () => {
      this.subscriber.removeListener('message', messageHandler);
      this.subscriber.unsubscribe(channel);
    };
  }

  onModuleDestroy() {
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }
}
