import { CoinMetadata, CoinStruct, getFullnodeUrl, GetObjectParams, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import BigNumber from 'bignumber.js';
import retry from 'async-retry';
import AppConfig from 'config/app.config';
import { sleep } from 'common/utils/time.utils';

const { fullnodeSuiUrl } = AppConfig();

export const suiClient = new SuiClient({
  url: fullnodeSuiUrl ?? getFullnodeUrl('mainnet'),
});

export const RETRY_MAX_ATTEMPT = 5;
export const RETRY_MIN_TIMEOUT = 1000;
export const RETRY_MAX_TIMEOUT = 5000;

export class SuiClientUtils {
  static getSuiClient(attempt: number) {
    let rpcUrl = '';
    switch (attempt) {
      case 0:
        rpcUrl = getFullnodeUrl('mainnet');
        break;
      case 1:
        rpcUrl = 'https://sui-mainnet.public.blastapi.io';
        break;
      case 2:
        rpcUrl = 'https://sui-mainnet.nodeinfra.com';
        break;
      default:
        rpcUrl = 'https://sui-mainnet.blockvision.org/v1/2osaezLZ3iUhDNTboJxvrWcDauY';
        break;
    }
    return new SuiClient({ url: rpcUrl });
  }

  static async getOwnerCoinOnchain(
    walletAddress: string,
    tokenAddress: string,
  ): Promise<[(CoinStruct & { owner: string })[], BigNumber]> {
    let client = suiClient;
    return await retry(
      async () => {
        const coins = await client.getCoins({
          owner: walletAddress,
          coinType: tokenAddress,
        });
        return [
          coins.data.map((coin) => ({ ...coin, owner: walletAddress })),
          coins.data.reduce((prev, coinStruct) => BigNumber(coinStruct.balance).plus(prev), BigNumber(0)),
        ];
      },
      {
        retries: RETRY_MAX_ATTEMPT,
        minTimeout: RETRY_MIN_TIMEOUT,
        maxTimeout: RETRY_MAX_TIMEOUT,
        onRetry: (e, attempt) => {
          console.log(`getOwnerCoinOnchain retry ${attempt}`, e);
          client = SuiClientUtils.getSuiClient(attempt);
        },
      },
    );
  }

  static async getOwnerCoinsOnchain(walletAddress: string): Promise<(CoinStruct & { owner: string })[]> {
    let client = suiClient;
    return await retry(
      async () => {
        const coins = await client.getAllCoins({
          owner: walletAddress,
        });
        let userCoins = coins.data.map((coin) => ({
          ...coin,
          owner: walletAddress,
        }));
        let hasNextPage = coins.hasNextPage;
        let nextCursor = coins.nextCursor;
        while (hasNextPage) {
          const nextCoins = await client.getAllCoins({
            owner: walletAddress,
            cursor: nextCursor,
          });
          userCoins = userCoins.concat(nextCoins.data.map((coin) => ({ ...coin, owner: walletAddress })));
          hasNextPage = nextCoins.hasNextPage;
          nextCursor = nextCoins.nextCursor;
          await sleep(1000);
        }
        return userCoins;
      },
      {
        retries: RETRY_MAX_ATTEMPT,
        minTimeout: RETRY_MIN_TIMEOUT,
        maxTimeout: RETRY_MAX_TIMEOUT,
        onRetry: (e, attempt) => {
          console.log(`getOwnerCoinsOnchain retry ${attempt}`, e);
          client = SuiClientUtils.getSuiClient(attempt);
        },
      },
    );
  }

  static async getAllCoinsByWalletAddress(
    walletAddress: string,
    options?: { nextCursor?: string; limit?: number },
  ): Promise<{
    data: CoinStruct[];
    hasNextPage: boolean;
    nextCursor?: string;
  }> {
    let client = suiClient;

    return await retry(
      async () => {
        return await client.getAllCoins({
          owner: walletAddress,
          cursor: options?.nextCursor ?? null,
          limit: options?.limit ? Math.min(options.limit, 50) : 50,
        });
      },
      {
        retries: RETRY_MAX_ATTEMPT,
        minTimeout: RETRY_MIN_TIMEOUT,
        maxTimeout: RETRY_MAX_TIMEOUT,
        onRetry: (e, attempt) => {
          console.log(`getAllCoinsByWalletAddress retry ${attempt}`, e);
          client = SuiClientUtils.getSuiClient(attempt);
        },
      },
    );
  }

  static async getCoinMetadata(coinType: string): Promise<CoinMetadata> {
    let client = suiClient;

    return await retry(
      async () => {
        const coin = await client.getCoinMetadata({
          coinType,
        });
        return coin;
      },
      {
        retries: RETRY_MAX_ATTEMPT,
        minTimeout: RETRY_MIN_TIMEOUT,
        maxTimeout: RETRY_MAX_TIMEOUT,
        onRetry: (e, attempt) => {
          console.log(`getCoinMetadata retry ${attempt}`, e);
          client = SuiClientUtils.getSuiClient(attempt);
        },
      },
    );
  }

  static async getReferenceGasPrice(): Promise<bigint> {
    let client = suiClient;

    return await retry(
      async () => {
        return await client.getReferenceGasPrice();
      },
      {
        retries: RETRY_MAX_ATTEMPT,
        minTimeout: RETRY_MIN_TIMEOUT,
        maxTimeout: RETRY_MAX_TIMEOUT,
        onRetry: (e, attempt) => {
          console.log(`getReferenceGasPrice retry ${attempt}`, e);
          client = SuiClientUtils.getSuiClient(attempt);
        },
      },
    );
  }

  static async getSuiObject(input: GetObjectParams) {
    let client = suiClient;

    return await retry(
      async () => {
        return await client.getObject(input);
      },
      {
        retries: RETRY_MAX_ATTEMPT,
        minTimeout: RETRY_MIN_TIMEOUT,
        maxTimeout: RETRY_MAX_TIMEOUT,
        onRetry: (e, attempt) => {
          console.log(`getSuiObject retry ${attempt}`, e);
          client = SuiClientUtils.getSuiClient(attempt);
        },
      },
    );
  }

  static async executeTransaction(txData: string, signature: string) {
    const tx = Transaction.from(txData);
    const bytes = Buffer.from(await tx.build({ client: suiClient })).toString('base64');

    const txResult = await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature: signature,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    return txResult;
  }
}
