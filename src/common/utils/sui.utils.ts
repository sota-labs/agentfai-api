const SUI_URL = 'https://suivision.xyz';
export class SuiUtils {
  static getWalletUrl(address: string): string {
    return `${SUI_URL}/account/${address}`;
  }

  static getTransactionUrl(txHash: string): string {
    return `${SUI_URL}/txblock/${txHash}`;
  }
}
