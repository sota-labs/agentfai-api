import { Module, forwardRef } from '@nestjs/common';
import { AgentModule } from 'modules/agent/agent.module';
import { CoinModule } from 'modules/coin/coin.module';
import { OrderBackendController } from 'modules/order/order.backend.controller';
import { OrderController } from 'modules/order/order.controller';
import { OrderService } from 'modules/order/order.service';
import { SharedModule } from 'modules/shared/shared.module';
import { SocketEmitterService } from 'modules/socket/socket-emitter.service';
import { SocketModule } from 'modules/socket/socket.module';
import { TxModule } from 'modules/tx/tx.module';
import { TxService } from 'modules/tx/tx.service';
import { UserModule } from 'modules/user/user.module';
import { OrderSell, OrderSellSchema } from './schemas/order-sell.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderBuy, OrderBuySchema } from 'modules/order/schemas/order-buy.schema';

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
    TxModule,
  ],
  controllers: [OrderController, OrderBackendController],
  providers: [OrderService, SocketEmitterService, TxService],
  exports: [OrderService],
})
export class OrderModule {}
