import { Module } from '@nestjs/common';
import { SharedModule } from 'modules/shared/shared.module';
import { CoinController } from './coin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinMetadata, CoinMetadataSchema } from './schemas/coin-metadata';
import { CoinService } from './coin.service';

@Module({
  imports: [SharedModule, MongooseModule.forFeature([{ name: CoinMetadata.name, schema: CoinMetadataSchema }])],
  providers: [CoinService],
  controllers: [CoinController],
})
export class CoinModule {}
