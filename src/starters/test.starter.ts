import dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { Transaction } from '@mysten/sui/transactions';
import { AppModule } from '../app.module';
import { suiClient } from 'common/utils/onchain/sui-client';
import { BaseDexUtils } from 'common/utils/dexes/base.dex.utils';
import { OrderService } from 'modules/order/order.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const orderService = app.get(OrderService);

  const walletAddress = process.env.WALLET_ADDRESS;
  const poolObjectId = '0xf25afa536d061503691d76d0b07ebce98eae53ff82721b656f42b2602b527673';

  const orderRes = await orderService.buy(
    {
      walletAddress,
      poolId: poolObjectId,
      amountIn: '0.0001',
      userId: '66b666b666b666b666b666b6',
      slippage: 40,
    },
    null,
  );

  console.log('========= orderRes =========');
  console.log(orderRes);

  const serializedTx = orderRes.txData;
  console.log('========= serializedTx =========');
  console.log(serializedTx);

  const tx2 = Transaction.from(serializedTx);
  console.log('========= tx2 =========');
  console.log(tx2);

  const ephemeralPrivateKey = process.env.PRIVATE_KEY;
  const baseDexUtils = new BaseDexUtils();
  const signedTx = await baseDexUtils.createUserSignature(tx2, ephemeralPrivateKey, suiClient);

  console.log('========= signedTx =========');
  console.log(signedTx);

  // const txData = await SuiClientUtils.executeTransaction(signedTx);
  // console.log('========= txData =========');
  // console.log(txData);
}

bootstrap();
