import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'common/guards/auth.guard';
import { AppLoggerMiddleware } from 'common/middlewares/app-logger.middleware';
import SwaggerConfig from 'config/swagger.config';
import { SharedModule } from 'modules/shared/shared.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from 'modules/auth/auth.module';
import { ThreadModule } from 'modules/threads/thread.module';
import { MessageModule } from 'modules/messages/messgae.module';

@Module({
  imports: [SharedModule, AuthModule, ThreadModule, MessageModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: SwaggerConfig,
      useValue: SwaggerConfig(),
    },
  ],
  exports: [SharedModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
