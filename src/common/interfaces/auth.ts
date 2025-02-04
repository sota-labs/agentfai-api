export interface IAuthUser {
  userId: string;
  displayName: string;
  defaultWallet: string;
  exp: number;
  iap?: number;
}
