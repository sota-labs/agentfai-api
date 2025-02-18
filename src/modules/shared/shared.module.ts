import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { RedisModule } from 'nestjs-redis';
import config from 'config';
import { Thread } from 'modules/thread/thread.schema';
import { ThreadSchema } from 'modules/thread/thread.schema';
import { MessageSchema } from 'modules/message/message.schema';
import { Message } from 'modules/message/message.schema';
import * as providers from 'modules/shared/providers';
import { autoImport } from 'common/utils/common.utils';
import { Tx } from 'modules/tx/schemas/tx.schema';
import { TxSchema } from 'modules/tx/schemas/tx.schema';
import { OrderBuySchema } from 'modules/order/schemas/order-buy.schema';
import { OrderBuy } from 'modules/order/schemas/order-buy.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: config,
      isGlobal: true,
      expandVariables: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.getOrThrow<string>('database.uri'),
          autoIndex: configService.getOrThrow<boolean>('database.autoIndex'),
        };
      },
      inject: [ConfigService],
    }),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('auth.jwt.secret'),
        expiresIn: configService.getOrThrow<string>('auth.jwt.expiresIn'),
      }),
      inject: [ConfigService],
    }),
    CacheModule.register({ isGlobal: true }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.getOrThrow<string>('redis.host'),
        password: configService.getOrThrow<string>('redis.password'),
        port: configService.getOrThrow<number>('redis.port'),
        db: configService.getOrThrow<number>('redis.db'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Thread.name, schema: ThreadSchema },
      { name: Message.name, schema: MessageSchema },
      { name: OrderBuy.name, schema: OrderBuySchema },
      { name: Tx.name, schema: TxSchema },
    ]),
  ],
  providers: [...autoImport(providers)],
  exports: [ConfigModule, JwtModule, MongooseModule, CacheModule, HttpModule, ...autoImport(providers)],
})
export class SharedModule {}
