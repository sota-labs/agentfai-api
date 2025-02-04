export type TWalletTrackAlert = {
  walletAddress: string;
  walletUrl: string;
  txUrl: string;
  aliasName: string;
  tokenBase: {
    name: string;
    symbol: string;
    address: string;
  };
  tokenQuote: {
    name: string;
    symbol: string;
    address: string;
  };
  marketCap: string;
  liquidity: string;
  baseAmount: string;
  quoteAmount: string;
  volumeUsd: string;
};
