import { NumericUtils } from './numeric.utils';

export class TokenUtils {
  static weiToDecimal(wei: string, decimals: number): string {
    return NumericUtils.toBigNumber(wei)
      .div(10 ** decimals)
      .toString();
  }
}
