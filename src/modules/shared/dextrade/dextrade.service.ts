import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DexTradePair } from './dextrade.interface';

@Injectable()
export class DextradeService {
  private readonly network: string;
  constructor(private readonly configService: ConfigService) {
    this.network = this.configService.getOrThrow<string>('app.network');
  }

  async getPairById(poolId: string): Promise<DexTradePair | null> {
    try {
      const response = await axios.get(
        `${this.configService.getOrThrow('app.dextradeUrl')}/${this.network}/pairs/${poolId}`,
      );

      return response.data;
    } catch (e) {
      return null;
    }
  }
}
