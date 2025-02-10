import { ENetwork } from 'common/constants/network';

export interface IUserWallet {
  network: ENetwork;
  address: string;
  userId: string;
  aliasName: string;
  publicKey: string;
  privateKey: string;
  balance: string;
  balanceTokenQuote?: string;
  balanceUsd: string;
  isDefault: boolean;
  isActive: boolean;
  isExternal: boolean;
  isSelected?: boolean;
}
