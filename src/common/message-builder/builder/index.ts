import { PriceAlertBuilder } from './price-alert';
import { WalletTrackAlertBuilder } from './wallet-track/wallet-track-alert';

export class MessageBuilder {
  public readonly priceAlert: PriceAlertBuilder;
  public readonly walletTrackAlert: WalletTrackAlertBuilder;

  constructor() {
    this.priceAlert = new PriceAlertBuilder();
    this.walletTrackAlert = new WalletTrackAlertBuilder();
  }
}
