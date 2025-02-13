import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TxService } from 'modules/tx/tx.service';
import { SharedModule } from 'modules/shared/shared.module';
import { TxBuy, TxBuySchema } from 'modules/tx/schemas/tx-buy.schema';
import { TxBackendController } from 'modules/tx/tx.backend.controller';
import { CoinModule } from 'modules/coin/coin.module';
import { AgentModule } from 'modules/agent/agent.module';

@Module({
  imports: [
    SharedModule,
    CoinModule,
    AgentModule,
    MongooseModule.forFeature([{ name: TxBuy.name, schema: TxBuySchema }]),
  ],
  controllers: [TxBackendController],
  providers: [TxService],
  exports: [TxService],
})
export class TxModule {}
