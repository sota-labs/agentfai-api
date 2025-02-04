export interface DextradeHolder {
  balance: string;
  balanceUsd: string;
  createdAt: string;
  network: string;
  ownedPercent: number;
  token: {
    address: string;
    name: string;
    symbol: string;
    logoImageUrl: string;
  };
  updatedAt: string;
  walletAddress: string;
  walletType: string;
}
export interface PaginateDextradeHolder {
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  docs: DextradeHolder[];
}

export interface DexTradeToken {
  address: string;
  bannerImageUrl: string;
  createdAt: string;
  decimals: number;
  isTrending: boolean;
  logoImageUrl: string;
  name: string;
  network: string;
  price: string;
  priceUsd: string;
  symbol: string;
  totalSupply: string;
  updatedAt: string;
  volumeUsd: string;
  isRug: boolean;
  circulatingSupply?: string;
  isBoostedUntil?: string | null;
  socials?: {
    websites?: {
      label: string;
      url: string;
    }[];
    socials?: {
      type: string;
      url: string;
    }[];
  };
  lockAmount?: string | null;
  lockedAmount?: string | null;
  lockTimestamp?: number | null;
  deployer?: string;
  deployedAt?: number;
  mintAuthority: boolean;
  freezeAuthority: boolean;
  amountBurned: string;
  deployerBalancePercent: number;
  top10HolderPercent: number;
}

export interface DexTradePair {
  network: string;
  dex: {
    network: string;
    dex: string;
    name: string;
    version: string;
  };
  dexName: string;
  pairId: string;
  poolId: string;
  deployer: string;
  slug: string;
  tokenBase: DexTradeToken;
  tokenQuote: DexTradeToken;
  reserveBase: string;
  initialReserveBase: string | null;
  reserveQuote: string;
  initialReserveQuote: string | null;
  bondingCurve: string | null;
  liquidity: string;
  liquidityUsd: string;
  volume: string;
  volumeUsd: string;
  marketCapUsd: string;
  lpSupply: number;
  lpBurned: string | null;
  lpBurnedPercent?: number;
  totalTxns: number;
  totalMakers: number;
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
  isXQuoteToken: boolean;
  timestamp: number;
  buyTxns: number;
  sellTxns: number;
  graduatedSlug: string | null;
  totalHolders: number;
  createdAt: string;
  updatedAt: string;
}
