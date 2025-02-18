/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from 'dotenv';
dotenv.config();

import { Transaction } from '@mysten/sui/transactions';
import { NestFactory } from '@nestjs/core';
import { BaseDexUtils } from 'common/utils/dexes/base.dex.utils';
import { suiClient } from 'common/utils/onchain/sui-client';
import { OrderService } from 'modules/order/order.service';
import { AppModule } from '../app.module';

async function buy() {
  const app = await NestFactory.create(AppModule);
  const orderService = app.get(OrderService);

  const walletAddress = process.env.WALLET_ADDRESS;
  const ephemeralPrivateKey = process.env.PRIVATE_KEY;
  const userId = process.env.USER_ID ?? 'userId';
  const poolObjectId = '0xe4ff047ec4e6cb5dec195c4c71bc435223bf0273f1473ab6a10cf6ad132bdda1';

  const orderRes = await orderService.buy(
    {
      walletAddress,
      poolId: poolObjectId,
      amountIn: '0.0001',
      userId,
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

  const baseDexUtils = new BaseDexUtils();
  const signedTx = await baseDexUtils.createUserSignature(tx2, ephemeralPrivateKey, suiClient);

  console.log('========= signedTx =========');
  console.log(signedTx);

  const orderBuy = await orderService.executeOrderBuy(
    {
      userId,
      requestId: orderRes.requestId,
      signature: signedTx.signature,
    },
    null,
  );
  console.log('========= orderBuy =========');
  console.log(orderBuy);
}

buy();
