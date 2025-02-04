import { renderHtml } from 'common/message-builder/templates';

export class PriceAlertBuilder {
  priceGoesOver(payload: {
    alertName: string;
    pairUrl: string;
    tokenBaseSymbol: string;
    tokenQuoteSymbol: string;
    tokenBaseName: string;
    targetPrice: string;
    triggerTime: string;
  }): string {
    const msg = renderHtml('price_goes_over', payload);
    return msg;
  }

  priceGoesUnder(payload: {
    alertName: string;
    pairUrl: string;
    tokenBaseSymbol: string;
    tokenQuoteSymbol: string;
    tokenBaseName: string;
    targetPrice: string;
    triggerTime: string;
  }): string {
    const msg = renderHtml('price_goes_under', payload);
    return msg;
  }
}
