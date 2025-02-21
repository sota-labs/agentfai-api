/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from 'dotenv';
dotenv.config();

import { Transaction } from '@mysten/sui/transactions';
import { NestFactory } from '@nestjs/core';
import { BaseDexUtils } from 'common/utils/dexes/base.dex.utils';
import { suiClient } from 'common/utils/onchain/sui-client';
import { OrderService } from 'modules/order/order.service';
import { AppModule } from '../app.module';
import { plainToClass } from 'class-transformer';
import { POOL_ID_EXAMPLE } from 'examples/config-test.example';
import { TxService } from 'modules/tx/tx.service';
import { TxDtoResponse } from 'modules/tx/dtos/get-all-txs.dto';

async function sell() {
  const app = await NestFactory.create(AppModule);
  const orderService = app.get(OrderService);
  const txService = app.get(TxService);

  const walletAddress = process.env.WALLET_ADDRESS;
  const ephemeralPrivateKey = process.env.PRIVATE_KEY;
  const userId = process.env.USER_ID ?? 'userId';
  const poolObjectId = POOL_ID_EXAMPLE;

  const orderRes = await orderService.sell(
    {
      walletAddress,
      poolId: poolObjectId,
      percent: 20,
      userId,
      slippage: 40,
    },
    null,
  );

  console.log('========= orderRes =========');
  // console.log(orderRes);

  const serializedTx = orderRes.txData;
  console.log('========= serializedTx =========');
  // console.log(serializedTx);

  const tx2 = Transaction.from(serializedTx);
  console.log('========= tx2 =========');
  // console.log(tx2);

  const baseDexUtils = new BaseDexUtils();
  const signedTx = await baseDexUtils.createUserSignature(tx2, ephemeralPrivateKey, suiClient);

  console.log('========= signedTx =========');
  // console.log(signedTx);

  const orderSell = await orderService.executeOrderSell(
    {
      userId,
      requestId: orderRes.requestId,
      signature: signedTx.signature,
    },
    null,
  );
  console.log('========= orderSell =========');
  const tx = await txService.findOneByRequestId(orderSell.requestId);
  console.log('========= tx =========');
  console.log(plainToClass(TxDtoResponse, tx));
}

sell();
