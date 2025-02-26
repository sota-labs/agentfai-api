import BigNumber from 'bignumber.js';
import { NumericUtils } from './numeric.utils';
import { SUI_ADDRESS } from 'common/constants/address';
import { SUI_TOKEN_ADDRESS_SHORT } from 'common/constants/address';

export class TokenUtils {
  static weiToDecimal(wei: string, decimals: number): string {
    return NumericUtils.toBigNumber(wei)
      .div(10 ** decimals)
      .toString();
  }

  static toTokenAmount(value: number | string | BigNumber, decimals: number): string {
    return new BigNumber(value || 0).dividedBy(new BigNumber(10).pow(decimals)).toString();
  }

  static isSuiToken(address: string): boolean {
    return address === SUI_TOKEN_ADDRESS_SHORT || address === SUI_ADDRESS;
  }
}
