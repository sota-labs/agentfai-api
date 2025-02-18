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
import { OrderSellResDto } from 'modules/order/dtos/res.dto';

async function sell() {
  const app = await NestFactory.create(AppModule);
  const orderService = app.get(OrderService);

  const walletAddress = process.env.WALLET_ADDRESS;
  const ephemeralPrivateKey = process.env.PRIVATE_KEY;
  const userId = process.env.USER_ID ?? 'userId';
  // const poolObjectId = '0xe4ff047ec4e6cb5dec195c4c71bc435223bf0273f1473ab6a10cf6ad132bdda1'; // cetus
  const poolObjectId = '0647154bedcbb70bececed3fd2090c70798a9602770fb4dfb1cf13371fa45c33'; // turbosfun

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
  console.log(plainToClass(OrderSellResDto, orderSell));
}

sell();
