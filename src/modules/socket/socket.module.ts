import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketEmitterService } from './socket-emitter.service';
import { SharedModule } from 'modules/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [SocketGateway, SocketEmitterService],
  exports: [SocketEmitterService],
})
export class SocketModule {}
