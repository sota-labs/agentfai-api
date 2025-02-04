import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ICommonKafkaMessage } from 'common/interfaces/kafka';
import { LoggerUtils } from 'common/utils/logger.utils';
import { Consumer, ConsumerConfig, Kafka } from 'kafkajs';
import winston from 'winston';

export abstract class BaseKafkaConsumer<T extends ICommonKafkaMessage> implements OnModuleInit, OnModuleDestroy {
  protected kafka: Kafka;
  protected consumer: Consumer;
  protected logger: winston.Logger;
  constructor(
    protected readonly topic: string,
    protected readonly brokers: string[],
    protected readonly consumerConfig: ConsumerConfig & {
      fromBeginning?: boolean;
      ssl?: boolean;
      sasl?: {
        username: string;
        password: string;
      };
    },
  ) {
    const kafka = new Kafka({
      clientId: `${topic}-client`,
      brokers,
      ...(consumerConfig.ssl && {
        ssl: consumerConfig.ssl,
        sasl: {
          mechanism: 'plain', // scram-sha-256 or scram-sha-512
          username: consumerConfig.sasl.username,
          password: consumerConfig.sasl.password,
        },
      }),
    });

    this.consumer = kafka.consumer({
      ...consumerConfig,
      groupId: consumerConfig.groupId.toUpperCase(),
    });

    this.logger = LoggerUtils.get(`${topic}-consumer`);

    console.log(
      `
                    
              ░█████╗░░█████╗░███╗░░██╗░██████╗██╗░░░██╗███╗░░░███╗███████╗██████╗░
              ██╔══██╗██╔══██╗████╗░██║██╔════╝██║░░░██║████╗░████║██╔════╝██╔══██╗
              ██║░░╚═╝██║░░██║██╔██╗██║╚█████╗░██║░░░██║██╔████╔██║█████╗░░██████╔╝
              ██║░░██╗██║░░██║██║╚████║░╚═══██╗██║░░░██║██║╚██╔╝██║██╔══╝░░██╔══██╗
              ╚█████╔╝╚█████╔╝██║░╚███║██████╔╝╚██████╔╝██║░╚═╝░██║███████╗██║░░██║
              ░╚════╝░░╚════╝░╚═╝░░╚══╝╚═════╝░░╚═════╝░╚═╝░░░░░╚═╝╚══════╝╚═╝░░╚═╝
                    
              - Topic: ${topic}
              - Brokers: ${brokers}
              - GroupId: ${consumerConfig.groupId}

      `,
    );
  }
  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: this.consumerConfig.fromBeginning });
    await this.start();
  }

  protected async start() {
    await this.consumer.run({
      eachBatchAutoResolve: false,
      autoCommit: false,
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        this.logger.info(
          `Processing batch message: ${batch.messages.length} messages from partition ${batch.partition} from ${batch.firstOffset()} -> ${batch.lastOffset()}`,
        );
        const start = performance.now();
        const msgs = [];
        for (const message of batch.messages) {
          if (!isRunning() || isStale()) break;
          msgs.push(JSON.parse(`${message.value}`));
          resolveOffset(message.offset);
          await heartbeat();
        }
        await this.eachBatch(msgs);
        const end = performance.now();
        this.logger.info(
          `Processed batch message: ${batch.messages.length} messages from partition ${batch.partition} from ${batch.firstOffset()} -> ${batch.lastOffset()} took ${(end - start).toFixed(2)}ms`,
        );
        await this.consumer.commitOffsets([
          { topic: this.topic, partition: batch.partition, offset: (Number(batch.lastOffset()) + 1).toString() },
        ]);
      },
    });
  }

  abstract eachBatch(batchMessage: T[]): Promise<void>;
}
