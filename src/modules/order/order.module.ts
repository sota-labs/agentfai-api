import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentModule } from 'modules/agent/agent.module';
import { CoinModule } from 'modules/coin/coin.module';
import { OrderController } from 'modules/order/order.controller';
import { OrderService } from 'modules/order/order.service';
import { OrderBuy, OrderBuySchema } from 'modules/order/schemas/order-buy.schema';
import { SharedModule } from 'modules/shared/shared.module';
import { SocketEmitterService } from 'modules/socket/socket-emitter.service';
import { SocketModule } from 'modules/socket/socket.module';
import { UserModule } from 'modules/user/user.module';
import { OrderSell, OrderSellSchema } from './schemas/order-sell.schema';

@Module({
  imports: [
    SharedModule,
    CoinModule,
    AgentModule,
    UserModule,
    MongooseModule.forFeature([
      { name: OrderBuy.name, schema: OrderBuySchema },
      { name: OrderSell.name, schema: OrderSellSchema },
    ]),
    forwardRef(() => SocketModule),
  ],
  controllers: [OrderController],
  providers: [OrderService, SocketEmitterService],
  exports: [OrderService],
})
export class OrderModule {}
