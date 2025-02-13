import dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { Transaction } from '@mysten/sui/transactions';
import { AppModule } from '../app.module';
import { CetusDexUtils } from 'common/utils/dexes/cetus.dex.utils';
import { suiClient, SuiClientUtils } from 'common/utils/onchain/sui-client';
import { SUI_TOKEN_METADATA } from 'common/constants/common';
import { BaseDexUtils } from 'common/utils/dexes/base.dex.utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const walletAddress = process.env.WALLET_ADDRESS;
  const poolObjectId = '0xf25afa536d061503691d76d0b07ebce98eae53ff82721b656f42b2602b527673';
  // create script to build buy transaction
  const tx = await CetusDexUtils.buildBuyTransaction({
    walletAddress,
    exactAmountIn: '1000000',
    gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
    poolObjectId,
    tokenIn: SUI_TOKEN_METADATA,
  });

  console.log('========= tx =========');
  console.log(tx);

  const serializedTx = await tx.toJSON();
  console.log('========= serializedTx =========');
  console.log(serializedTx);

  const tx2 = Transaction.from(serializedTx);
  console.log('========= tx2 =========');
  console.log(tx2);

  const ephemeralPrivateKey = process.env.PRIVATE_KEY;
  const signedTx = await BaseDexUtils.createUserSignature(tx2, ephemeralPrivateKey, suiClient);

  console.log('========= signedTx =========');
  console.log(signedTx);

  // const txData = await SuiClientUtils.executeTransaction(signedTx);
  // console.log('========= txData =========');
  // console.log(txData);
}

bootstrap();
