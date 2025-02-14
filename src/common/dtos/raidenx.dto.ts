export class TokenDto {
  network: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  circulatingSupply: string;
  price: string;
  priceUsd: string;
  isBoostedUntil: string;
  volumeUsd: string;
  isTrending: boolean;
  isRug: boolean;
  bannerImageUrl: string;
  logoImageUrl: string;
  socials: {
    websites: {
      label: string;
      url: string;
    }[];
    socials: {
      type: string;
      url: string;
    }[];
  };
  lockAmount: string;
  lockedAmount: string;
  lockTimestamp: string;
  deployer: string;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  amountBurned: string;
  deployerBalancePercent: number;
  top10HolderPercent: number;
  deployedAt: number;
  createdAt: string;
  updatedAt: string;
}

export class PairDto {
  network: string;
  dex: {
    network: string;
    dex: string;
    name: string;
    version: string;
  };
  pairId: string;
  poolId: string;
  deployer: string;
  slug: string;
  tokenBase: TokenDto;
  tokenQuote: TokenDto;
  reserveBase: string;
  reserveQuote: string;
  liquidity: string;
  liquidityUsd: string;
  lpBurned: number;
  lpSupply: number;
  lpBurnedPercent?: number;
  volume: string;
  volumeUsd: string;
  marketCapUsd: string;
  totalTxns: number;
  totalMakers: number;
  isTrending: boolean;
  bondingCurve: number;
  stats: {
    percent: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    volume: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    marketCapPercent: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    maker: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    buyer: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    seller: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    buyVolume: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    sellVolume: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    buyTxn: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    sellTxn: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
    totalNumTxn: {
      '5m': number;
      '1h': number;
      '6h': number;
      '24h': number;
    };
  };
  pairType: string | null;
  feeTier: string | null;
  isXQuoteToken: boolean;
  timestamp: number;
  buyTxns: number;
  sellTxns: number;
  graduatedSlug: string;
  createdAt: string;
  updatedAt: string;
}
