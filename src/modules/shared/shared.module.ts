import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule } from 'nestjs-redis';
import config from 'config';

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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('app.jwt.secret'),
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
  ],
  providers: [],
  exports: [ConfigModule, JwtModule, MongooseModule, CacheModule],
})
export class SharedModule {}
