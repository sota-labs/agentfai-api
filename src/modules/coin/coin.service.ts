import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';
import { ListCoinMetadataResDto } from 'modules/coin/dto/res';
import { TokenUtils } from 'common/utils/token.utils';
import { sortTrick } from 'common/utils/common.utils';
import { CoinMetadata, CoinMetadataDocument } from 'modules/coin/schemas/coin-metadata';
import { LoggerUtils } from 'common/utils/logger.utils';
import { SuiClientUtils } from 'common/utils/onchain/sui-client';

@Injectable()
export class CoinService {
  private readonly logger = LoggerUtils.get(CoinService.name);

  constructor(
    @InjectModel(CoinMetadata.name) private readonly coinMetadataModel: PaginateModel<CoinMetadataDocument>,
  ) {}

  async getPortfolio(
    walletAddress: string,
    options?: { nextCursor?: string; limit?: number },
  ): Promise<ListCoinMetadataResDto> {
    this.logger.info(`Getting portfolio for wallet ${walletAddress} with options ${JSON.stringify(options)}`);
    const coins = await SuiClientUtils.getAllCoinsByWalletAddress(walletAddress, options);
    this.logger.info(`Found ${coins.data.length} coins for wallet ${walletAddress}`);

    const manyCoinsMetadata = await this.getCoinMetadata(coins.data.map((coin) => coin.coinType));

    const data = coins.data.map((coin, index) => {
      const coinMetadata = manyCoinsMetadata[index];
      return {
        ...coin,
        balance: TokenUtils.toTokenAmount(coin.balance, coinMetadata.decimals),
        coinMetadata,
      };
    });

    return {
      docs: data,
      hasNextPage: coins.hasNextPage,
      nextCursor: coins.nextCursor,
    };
  }

  async getCoinMetadata(addresses: string[]): Promise<CoinMetadata[]> {
    const coins = await this.coinMetadataModel
      .find({ address: { $in: addresses } })
      .select('-_id -__v -createdAt -updatedAt');

    const missingAddresses = addresses.filter((address) => !coins.find((coin) => coin.address === address));

    // Get missing coins metadata from onchain
    const missingCoinsMetadata: CoinMetadata[] = await Promise.all(
      missingAddresses.map(async (address) => {
        const { decimals, name, symbol, description, iconUrl } = await SuiClientUtils.getCoinMetadata(address);
        return {
          address,
          decimals,
          name,
          symbol,
          description,
          iconUrl: iconUrl,
        };
      }),
    );

    // save missing coins metadata to db
    if (missingCoinsMetadata.length > 0) {
      this.logger.info(`Saving ${missingCoinsMetadata.length} missing coins metadata to db`);
      await this.coinMetadataModel.create(missingCoinsMetadata);
    }

    const allCoinsMetadata = [...coins, ...missingCoinsMetadata];
    return sortTrick(allCoinsMetadata, addresses, 'address');
  }
}
