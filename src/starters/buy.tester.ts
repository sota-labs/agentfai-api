import dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { Transaction } from '@mysten/sui/transactions';
import { suiClient, SuiClientUtils } from 'common/utils/onchain/sui-client';
import { BaseDexUtils } from 'common/utils/dexes/base.dex.utils';
import { OrderService } from 'modules/order/order.service';
import { AppModule } from '../app.module';

async function buy() {
  const app = await NestFactory.create(AppModule);
  const orderService = app.get(OrderService);

  const walletAddress = process.env.WALLET_ADDRESS;
  const poolObjectId = '0x4b19a734320899abc84702b2b661036908d50b7af825da89026d90a916ac47ae';

  const orderRes = await orderService.buy(
    {
      walletAddress,
      poolId: poolObjectId,
      amountIn: '0.001',
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

  const txData = await SuiClientUtils.executeTransaction(serializedTx, signedTx.signature);
  console.log('========= tx buy =========');
  console.log(txData);
}

buy();
