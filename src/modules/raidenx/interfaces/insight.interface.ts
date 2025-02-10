interface IToken {
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  logoImageUrl: string;
  bannerImageUrl: string;
}

interface IInsight {
  pair: string;
  slug: string;
  tokenBase: IToken;
  token: IToken;
  tokenQuote: IToken;
  volumeUsdBought: string;
  volumeUsdSold: string;
  baseAmountBought: string;
  baseAmountSold: string;
  liquidity: string;
  liquidityUsd: string;
  balance: string;
  balanceUsd: string;
  walletName: string;
  poolId: string;
  dex: string;
  updatedAt: string;
}

interface IPositionRes {
  totalDocs: number;
  limit: number;
  page: number;
  docs: IInsight[];
}

export { IToken, IInsight, IPositionRes };
