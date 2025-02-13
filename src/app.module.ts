import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'common/guards/auth.guard';
import { AppLoggerMiddleware } from 'common/middlewares/app-logger.middleware';
import SwaggerConfig from 'config/swagger.config';
import { SharedModule } from 'modules/shared/shared.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from 'modules/auth/auth.module';
import { ThreadModule } from 'modules/thread/thread.module';
import { MessageModule } from 'modules/message/message.module';
import { AgentModule } from 'modules/agent/agent.module';
import { UserModule } from 'modules/user/user.module';
import { RaidenxModule } from 'modules/raidenx/raidenx.module';
import { CoinModule } from 'modules/coin/coin.module';
import { TxModule } from 'modules/tx/tx.module';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    ThreadModule,
    MessageModule,
    AgentModule,
    UserModule,
    RaidenxModule,
    CoinModule,
    TxModule,
  ],
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
