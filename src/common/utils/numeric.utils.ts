import BigNumber from 'bignumber.js';
import { Decimal128 } from 'bson';

type TNumericValue = string | number | BigNumber | Decimal128;
export class NumericUtils {
  static toBigNumber = (value: TNumericValue): BigNumber => new BigNumber(value.toString());

  static toNegative = (value: TNumericValue): string => NumericUtils.toBigNumber(value).abs().negated().toString();

  static accumulate = <T>(initValues: T[], key: keyof T, initialValue: string = '0'): string =>
    initValues
      .reduce(
        (acc, curr) =>
          NumericUtils.toBigNumber(acc)
            .plus(NumericUtils.toBigNumber(curr[key]?.toString() ?? '0'))
            .toString(),
        initialValue,
      )
      .toString();

  static multiply = (value1: TNumericValue, value2: TNumericValue): string =>
    NumericUtils.toBigNumber(value1).multipliedBy(NumericUtils.toBigNumber(value2)).toString();

  static toDecimal128 = (value: TNumericValue): Decimal128 => new Decimal128(value.toString());

  static plusToDecimal128 = (value1: TNumericValue, value2: TNumericValue): Decimal128 =>
    NumericUtils.toDecimal128(NumericUtils.toBigNumber(value1).plus(NumericUtils.toBigNumber(value2)).toString());

  static formatNumericValueToString(input: number | string, fixed = 2): string {
    const absInput = Math.abs(Number(input));

    if (absInput >= 1) {
      return `${NumericUtils.formatNumberWithSuffix(input, fixed)}`;
    }

    if (absInput < 1 && absInput > 0) {
      return `${NumericUtils.formatNumericValue(input, fixed)}`;
    }

    return `${input}`;
  }

  static formatNumericValue(input: number | string, fixed = 4): string {
    const subscriptMap = {
      '0': '₀',
      '1': '₁',
      '2': '₂',
      '3': '₃',
      '4': '₄',
      '5': '₅',
      '6': '₆',
      '7': '₇',
      '8': '₈',
      '9': '₉',
    };

    if (typeof input === 'string') {
      input = Number(input);
    }

    if (isNaN(input)) {
      return '--';
    }

    const absInput = Math.abs(Number(input));

    if (absInput >= 0.01) {
      return parseFloat(input.toFixed(fixed)).toString();
    }

    const scientificStr = input.toExponential();
    const [baseStr, expStr] = scientificStr.split('e-');
    const base = parseFloat(baseStr);
    const exponent = parseInt(expStr, 10);
    let isNegativeNumber = false;

    let significantDigits = (base * 10000).toFixed(0).substring(0, fixed).replace(/0+$/, '');
    if (significantDigits.includes('-')) {
      isNegativeNumber = true;
      significantDigits = significantDigits.replace('-', '');
    }

    const subscriptExponent = (exponent - 1)
      .toString()
      .split('')
      .map((digit) => subscriptMap[digit] || digit)
      .join('');
    return `${isNegativeNumber ? '-' : ''}0.0${subscriptExponent}${significantDigits}`;
  }

  static formatNumberWithSuffix(input: number | string, fixed = 2): string {
    if (typeof input === 'string') {
      input = Number(input);
    }

    if (isNaN(input)) {
      return 'N/A';
    }
    const absInput = Math.abs(input);
    if (absInput >= 1e9) {
      return `${(input / 1e9).toFixed(fixed)}B`;
    }
    if (absInput >= 1e6) {
      return `${(input / 1e6).toFixed(fixed)}M`;
    }
    if (absInput >= 1e3) {
      return `${(input / 1e3).toFixed(fixed)}K`;
    }

    return `${input.toFixed(fixed)}`;
  }

  static isZero = (value: TNumericValue): boolean => NumericUtils.toBigNumber(value).eq(0);

  static isEqual = (value1: TNumericValue, value2: TNumericValue): boolean =>
    NumericUtils.toBigNumber(value1).eq(NumericUtils.toBigNumber(value2));

  static isGt = (value1: TNumericValue, value2: TNumericValue): boolean =>
    NumericUtils.toBigNumber(value1).gt(NumericUtils.toBigNumber(value2));

  static isGte = (value1: TNumericValue, value2: TNumericValue): boolean =>
    NumericUtils.toBigNumber(value1).gte(NumericUtils.toBigNumber(value2));

  static isLt = (value1: TNumericValue, value2: TNumericValue): boolean =>
    NumericUtils.toBigNumber(value1).lt(NumericUtils.toBigNumber(value2));

  static isLte = (value1: TNumericValue, value2: TNumericValue): boolean =>
    NumericUtils.toBigNumber(value1).lte(NumericUtils.toBigNumber(value2));

  static rndIntFromTo = (from: number, to: number): number => Math.floor(Math.random() * (to - from + 1)) + from;

  static compare = (value1: TNumericValue, value2: TNumericValue): number =>
    NumericUtils.toBigNumber(value1).comparedTo(NumericUtils.toBigNumber(value2));

  static formatNumberWithCommas(input: number | string, fixed = 2): string {
    if (input == 0 || input == '0') return '0';
    // format number with K, M, B, T
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixIndex = Math.floor(Math.log10(Math.abs(Number(input))) / 3);
    const suffix = suffixes[suffixIndex] ?? '';
    const value = Number(input) / 10 ** (suffixIndex * 3);
    return value.toFixed(fixed).replace(/0+$/, '') + suffix;
  }

  static truncateString(str: string, maxLength: number, keepStart: number, keepEnd: number): string {
    if (str.length <= maxLength) {
      return str;
    }

    if (keepStart + keepEnd >= maxLength) {
      return str.substring(0, maxLength);
    }

    const start = str.substring(0, keepStart);
    const end = str.substring(str.length - keepEnd);

    return `${start}...${end}`;
  }

  static exactAmountIn = (amountIn: TNumericValue, decimals: number): BigNumber =>
    NumericUtils.toBigNumber(amountIn)
      .multipliedBy(10 ** decimals)
      .integerValue(BigNumber.ROUND_FLOOR);
}
