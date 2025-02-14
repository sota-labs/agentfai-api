import { Module, forwardRef } from '@nestjs/common';
import { SharedModule } from 'modules/shared/shared.module';
import { TxModule } from 'modules/tx/tx.module';
import { SocketEmitterService } from './socket-emitter.service';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [SharedModule, forwardRef(() => TxModule)],
  providers: [SocketGateway, SocketEmitterService],
  exports: [SocketEmitterService],
})
export class SocketModule {}
