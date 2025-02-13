import { Module } from '@nestjs/common';
import { SharedModule } from 'modules/shared/shared.module';
import { CoinController } from 'modules/coin/coin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinMetadata, CoinMetadataSchema } from 'modules/coin/schemas/coin-metadata';
import { CoinService } from 'modules/coin/coin.service';

@Module({
  imports: [SharedModule, MongooseModule.forFeature([{ name: CoinMetadata.name, schema: CoinMetadataSchema }])],
  controllers: [CoinController],
  providers: [CoinService],
  exports: [CoinService],
})
export class CoinModule {}
