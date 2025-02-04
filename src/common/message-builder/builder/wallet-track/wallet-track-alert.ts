import { TWalletTrackAlert } from 'common/message-builder/shares/type';
import { renderHtml } from 'common/message-builder/templates';

export class WalletTrackAlertBuilder {
  buy(payload: TWalletTrackAlert): string {
    const msg = renderHtml('buy', payload);
    return msg;
  }

  sell(payload: TWalletTrackAlert): string {
    const msg = renderHtml('sell', payload);
    return msg;
  }
}
