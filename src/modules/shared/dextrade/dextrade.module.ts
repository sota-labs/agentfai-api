import { Module } from '@nestjs/common';
import { DextradeService } from './dextrade.service';

@Module({
  imports: [],
  providers: [DextradeService],
  exports: [DextradeService],
})
export class DextradeModule {}
