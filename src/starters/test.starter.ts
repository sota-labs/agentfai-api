/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { Transaction } from '@mysten/sui/transactions';
import { AppModule } from '../app.module';
import { suiClient, SuiClientUtils } from 'common/utils/onchain/sui-client';
import { BaseDexUtils } from 'common/utils/dexes/base.dex.utils';
import { OrderService } from 'modules/order/order.service';

async function buy() {
  const app = await NestFactory.create(AppModule);
  const orderService = app.get(OrderService);

  const walletAddress = process.env.WALLET_ADDRESS;
  const poolObjectId = '0xe4ff047ec4e6cb5dec195c4c71bc435223bf0273f1473ab6a10cf6ad132bdda1';

  const orderRes = await orderService.buy(
    {
      walletAddress,
      poolId: poolObjectId,
      amountIn: '0.0001',
      userId: '1262915258',
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

async function sell() {
  const app = await NestFactory.create(AppModule);
  const orderService = app.get(OrderService);

  const walletAddress = process.env.WALLET_ADDRESS;
  const poolObjectId = '0xe4ff047ec4e6cb5dec195c4c71bc435223bf0273f1473ab6a10cf6ad132bdda1';

  const orderRes = await orderService.sell(
    {
      walletAddress,
      poolId: poolObjectId,
      percent: 20,
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
  console.log('========= tx sell =========');
  console.log(txData);
}

buy();
// sell();
