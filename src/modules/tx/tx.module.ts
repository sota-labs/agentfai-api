import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TxService } from 'modules/tx/tx.service';
import { SharedModule } from 'modules/shared/shared.module';
import { TxBuy, TxBuySchema } from 'modules/tx/schemas/tx-buy.schema';
import { TxBackendController } from 'modules/tx/tx.backend.controller';
import { CoinModule } from 'modules/coin/coin.module';
import { AgentModule } from 'modules/agent/agent.module';
import { UserModule } from 'modules/user/user.module';
import { SocketEmitterService } from 'modules/socket/socket-emitter.service';
import { TxController } from 'modules/tx/tx.controller';
import { SocketModule } from 'modules/socket/socket.module';

@Module({
  imports: [
    SharedModule,
    CoinModule,
    AgentModule,
    UserModule,
    MongooseModule.forFeature([{ name: TxBuy.name, schema: TxBuySchema }]),
    forwardRef(() => SocketModule),
  ],
  controllers: [TxController, TxBackendController],
  providers: [TxService, SocketEmitterService],
  exports: [TxService],
})
export class TxModule {}
