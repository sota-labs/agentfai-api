import BigNumber from 'bignumber.js';
import { DexTradePair } from 'modules/shared/dextrade/dextrade.interface';

export const bigNumDiv = (a: string | number | BigNumber, b: string | number | BigNumber) => {
  const amountA = new BigNumber(a || 0);
  const amountB = new BigNumber(b || 0);
  if (amountB.isZero()) {
    return '0';
  }
  return amountA.div(amountB).toFixed();
};

const MIN_LIQUIDITY_USD = 100;

export class DextradeUtils {
  static getCirculatingSupply(pair: DexTradePair): string {
    if (pair.tokenBase?.circulatingSupply && !BigNumber(pair.tokenBase?.circulatingSupply).isZero()) {
      return pair.tokenBase?.circulatingSupply;
    }
    if (BigNumber(pair?.tokenBase?.totalSupply).isZero()) {
      return '0';
    }
    const tokenBurned = pair?.tokenBase?.amountBurned || 0;
    if (!BigNumber(tokenBurned).isZero()) {
      return BigNumber(pair?.tokenBase?.totalSupply).minus(BigNumber(tokenBurned)).toString();
    }
    return pair?.tokenBase?.totalSupply;
  }

  static calculateMCap(pair: DexTradePair): number | null {
    const circulatingSupply = this.getCirculatingSupply(pair);

    return new BigNumber(circulatingSupply).isGreaterThan(0)
      ? new BigNumber(circulatingSupply).multipliedBy(pair.tokenBase.priceUsd).toNumber()
      : null;
  }

  static calculateTargetPriceUsdByMc(pair: DexTradePair, mc: number): number {
    const circulatingSupply = this.getCirculatingSupply(pair);
    return new BigNumber(mc).dividedBy(circulatingSupply).toNumber();
  }

  static isRugPool(pair: DexTradePair): boolean {
    return pair.tokenBase.isRug || new BigNumber(pair.liquidityUsd).gte(MIN_LIQUIDITY_USD);
  }
}
