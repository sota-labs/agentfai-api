import { CoinMetadata, CoinStruct, getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import AppConfig from 'config/app.config';

const { fullnodeSuiUrl } = AppConfig();

export const suiClient = new SuiClient({
  url: fullnodeSuiUrl ?? getFullnodeUrl('mainnet'),
});

export async function getOwnerCoinOnchain(
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

export async function getAllCoins(walletAddress: string): Promise<{
  data: CoinStruct[];
  hasNextPage: boolean;
  nextCursor?: string;
}> {
  const client = suiClient;

  const coins = await client.getAllCoins({
    owner: walletAddress,
  });

  const uniqueCoins = coins.data.filter(
    (value, index, self) => self.findIndex((t) => t.coinType === value.coinType) === index,
  );

  return {
    data: uniqueCoins,
    hasNextPage: coins.hasNextPage,
    nextCursor: coins.nextCursor,
  };
}

export async function getCoinMetadata(coinType: string): Promise<CoinMetadata> {
  const client = suiClient;

  const coin = await client.getCoinMetadata({
    coinType,
  });

  return coin;
}
