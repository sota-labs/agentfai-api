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

  async getCoinMetadata(tokenAddresses: string[]): Promise<CoinMetadata[]> {
    const coins = await this.coinMetadataModel
      .find({ tokenAddress: { $in: tokenAddresses } })
      .select('-_id -__v -createdAt -updatedAt');

    const missingTokenAddresses = tokenAddresses.filter(
      (tokenAddress) => !coins.find((coin) => coin.tokenAddress === tokenAddress),
    );

    // Get missing coins metadata from onchain
    const missingCoinsMetadata: CoinMetadata[] = await Promise.all(
      missingTokenAddresses.map(async (tokenAddress) => {
        const { decimals, name, symbol, description, iconUrl } = await SuiClientUtils.getCoinMetadata(tokenAddress);
        return {
          tokenAddress,
          decimals,
          name,
          symbol,
          description,
          logoUrl: iconUrl,
        };
      }),
    );

    // save missing coins metadata to db
    if (missingCoinsMetadata.length > 0) {
      this.logger.info(`Saving ${missingCoinsMetadata.length} missing coins metadata to db`);
      await this.coinMetadataModel.create(missingCoinsMetadata);
    }

    const allCoinsMetadata = [...coins, ...missingCoinsMetadata];
    return sortTrick(allCoinsMetadata, tokenAddresses, 'tokenAddress');
  }
}
