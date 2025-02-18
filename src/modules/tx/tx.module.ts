import { Module } from '@nestjs/common';
import { SharedModule } from 'modules/shared/shared.module';
import { TxController } from 'modules/tx/tx.controller';
import { TxService } from 'modules/tx/tx.service';

@Module({
  imports: [SharedModule],
  controllers: [TxController],
  providers: [TxService],
  exports: [TxService],
})
export class TxModule {}
