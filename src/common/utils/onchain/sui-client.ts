import { CoinMetadata, CoinStruct, getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import AppConfig from 'config/app.config';

const { fullnodeSuiUrl } = AppConfig();

export const suiClient = new SuiClient({
  url: fullnodeSuiUrl ?? getFullnodeUrl('mainnet'),
});

export class SuiClientUtils {
  static async getOwnerCoinOnchain(
    walletAddress: string,
    tokenAddress: string,
  ): Promise<[(CoinStruct & { owner: string })[], BigNumber]> {
    const client = suiClient;

    const coins = await client.getCoins({
      owner: walletAddress,
      coinType: tokenAddress,
    });
    return [
      coins.data.map((coin) => ({ ...coin, owner: walletAddress })),
      coins.data.reduce((prev, coinStruct) => BigNumber(coinStruct.balance).plus(prev), BigNumber(0)),
    ];
  }

  static async getAllCoinsByWalletAddress(
    walletAddress: string,
    options?: { nextCursor?: string; limit?: number },
  ): Promise<{
    data: CoinStruct[];
    hasNextPage: boolean;
    nextCursor?: string;
  }> {
    const client = suiClient;

    return await client.getAllCoins({
      owner: walletAddress,
      cursor: options?.nextCursor ?? null,
      limit: options?.limit ? Math.min(options.limit, 50) : 50,
    });
  }

  static async getCoinMetadata(coinType: string): Promise<CoinMetadata> {
    const client = suiClient;

    const coin = await client.getCoinMetadata({
      coinType,
    });

    return coin;
  }
}
