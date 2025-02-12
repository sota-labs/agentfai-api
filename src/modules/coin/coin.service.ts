import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CoinMetadata, CoinMetadataDocument } from './schemas/coin-metadata';
import { PaginateModel } from 'mongoose';
import { getAllCoins, getCoinMetadata } from 'common/utils/onchain/sui-client';
import { IPagination } from 'common/decorators/paginate.decorator';
import { PaginatedCoinMetadataResDto } from './dto/res';
import { TokenUtils } from 'common/utils/token.utils';

@Injectable()
export class CoinService {
  constructor(
    @InjectModel(CoinMetadata.name) private readonly coinMetadataModel: PaginateModel<CoinMetadataDocument>,
  ) {}

  async getPortfolio(walletAddress: string, paginate: IPagination): Promise<PaginatedCoinMetadataResDto> {
    const allCoins = await getAllCoins(walletAddress);

    const allCoinsMetadata = await this.coinMetadataModel.find().select('-_id -__v -createdAt -updatedAt');

    const result = await Promise.all(
      allCoins.data.map(async (coin) => {
        const coinMetadata = allCoinsMetadata.find((coinMetadata) => coinMetadata.tokenAddress === coin.coinType);
        if (!coinMetadata) {
          const { decimals, name, symbol, description, iconUrl } = await getCoinMetadata(coin.coinType);
          const balance = TokenUtils.toTokenAmount(coin.balance, decimals);
          await this.coinMetadataModel.create({
            tokenAddress: coin.coinType,
            decimals,
            name,
            symbol,
            description,
            logoUrl: iconUrl,
          });
          return {
            ...coin,
            balance,
            coinMetadata: {
              tokenAddress: coin.coinType,
              decimals,
              name,
              symbol,
              description,
              logoUrl: iconUrl,
            },
          };
        }

        const balance = TokenUtils.toTokenAmount(coin.balance, coinMetadata.decimals);
        return {
          ...coin,
          balance,
          coinMetadata,
        };
      }),
    );

    return this.paginate(result, paginate);
  }

  private paginate(
    arr: any[],
    paginate: IPagination,
  ): {
    docs: any[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
  } {
    const start = (paginate.page - 1) * paginate.limit;
    const end = paginate.page * paginate.limit;

    return {
      docs: arr.slice(start, end),
      totalDocs: arr.length,
      limit: paginate.limit,
      page: paginate.page,
      totalPages: Math.ceil(arr.length / paginate.limit),
    };
  }
}
