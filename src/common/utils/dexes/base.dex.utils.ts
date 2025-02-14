import { Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag } from '@mysten/sui/utils';
import { decodeSuiPrivateKey, SignatureWithBytes } from '@mysten/sui/cryptography';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import raidenxConfig from 'config/raidenx.config';
import { SuiClientUtils } from 'common/utils/onchain/sui-client';
import { SUI_TOKEN_ADDRESS_SHORT } from 'common/constants/address';
import { TSwapParams } from 'common/types/dex.type';

const { sponsorAddress } = raidenxConfig();

export interface IDexUtils {
  buildBuyParams(params: TSwapParams): Promise<any>;
  buildBuyTransaction(params: any): Promise<Transaction>;

  buildSellParams(params: TSwapParams): Promise<any>;
  buildSellTransaction(params: any): Promise<Transaction>;
}

export class BaseDexUtils {
  async buildSponsoredTransaction(tx: Transaction) {
    const coins = await SuiClientUtils.getOwnerCoinsOnchain(sponsorAddress);
    const suiCoins = coins.filter(
      (coin) => normalizeStructTag(coin.coinType) === normalizeStructTag(SUI_TOKEN_ADDRESS_SHORT),
    );
    const gasBasePrice = await SuiClientUtils.getReferenceGasPrice();
    tx.setGasOwner(sponsorAddress);
    tx.setGasPrice(gasBasePrice);
    tx.setGasPayment(
      suiCoins.map((coin) => ({
        objectId: coin.coinObjectId,
        version: coin.version,
        digest: coin.digest,
      })),
    );

    return tx;
  }

  extractTokenX2YFromPoolType(poolType: string): { tokenXAddress?: string; tokenYAddress?: string } {
    const match = poolType.match(/<(.+)>/);
    if (!match) return {};

    const tokens = match[1].split(',').map((t) => t.trim());
    if (tokens.length !== 2) return {};

    return {
      tokenXAddress: tokens[0],
      tokenYAddress: tokens[1],
    };
  }

  async createUserSignature(
    txBlock: Transaction,
    ephemeralPrivateKey: string,
    client: SuiClient,
  ): Promise<SignatureWithBytes> {
    const keyPair = decodeSuiPrivateKey(ephemeralPrivateKey);

    const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(keyPair.secretKey);

    return await txBlock.sign({
      client,
      signer: ephemeralKeyPair,
    });
  }
}
