import { Module, forwardRef } from '@nestjs/common';
import { OrderModule } from 'modules/order/order.module';
import { SharedModule } from 'modules/shared/shared.module';
import { SocketEmitterService } from './socket-emitter.service';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [SharedModule, forwardRef(() => OrderModule)],
  providers: [SocketGateway, SocketEmitterService],
  exports: [SocketEmitterService],
})
export class SocketModule {}
