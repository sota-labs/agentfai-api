import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import BigNumber from 'bignumber.js';
import { Decimal128 } from 'bson';
import { ClientSession, Model } from 'mongoose';
import { Snowflake } from 'nodejs-snowflake';
import { EDex, EOrderSide } from 'common/constants/dex';
import { IWsOrderReqPayload, IWsOrderResultPayload } from 'common/interfaces/socket';
import { TCoinMetadata } from 'common/types/coin.type';
import { FactoryDexUtils } from 'common/utils/dexes/factory.dex.utils';
import { LoggerUtils } from 'common/utils/logger.utils';
import { SuiClientUtils } from 'common/utils/onchain/sui-client';
import { TimeUtils } from 'common/utils/time.utils';
import { CoinService } from 'modules/coin/coin.service';
import { OrderResDto } from 'modules/order/dtos/res.dto';
import { transformOrderBuyToTx, transformOrderSellToTx } from 'modules/order/order.helper';
import { OrderBuy, OrderBuyDocument, OrderBuyStatus } from 'modules/order/schemas/order-buy.schema';
import { OrderSell, OrderSellDocument, OrderSellStatus } from 'modules/order/schemas/order-sell.schema';
import { RaidenxProvider } from 'modules/shared/providers';
import { SocketEmitterService } from 'modules/socket/socket-emitter.service';
import { SocketEvent } from 'modules/socket/socket.constant';
import { TxService } from 'modules/tx/tx.service';
import { UserService } from 'modules/user/user.service';

@Injectable()
export class OrderService {
  private readonly logger = LoggerUtils.get(OrderService.name);
  private readonly snowflake = new Snowflake({
    custom_epoch: new Date().getTime(),
  });

  constructor(
    @InjectModel(OrderBuy.name) private readonly orderBuyModel: Model<OrderBuyDocument>,
    @InjectModel(OrderSell.name) private readonly orderSellModel: Model<OrderSellDocument>,
    private readonly coinService: CoinService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => SocketEmitterService))
    private readonly socketEmitterService: SocketEmitterService,
    private readonly raidenxProvider: RaidenxProvider,
    private readonly txService: TxService,
  ) {}

  async buyByUserId(
    userId: string,
    params: {
      tokenIn?: string;
      poolId: string;
      amountIn: string;
      slippage: number;
    },
    session: ClientSession,
  ): Promise<OrderResDto> {
    const user = await this.userService.getUserById(userId, session);

    return this.buy(
      {
        userId,
        walletAddress: user.zkAddress,
        ...params,
      },
      session,
    );
  }

  async buy(
    params: {
      walletAddress: string;
      tokenIn?: string;
      poolId: string;
      amountIn: string;
      slippage: number;
      userId: string;
    },
    session: ClientSession,
  ): Promise<OrderResDto> {
    const poolInfo = await this.raidenxProvider.common.getPoolInfo(params.poolId);
    if (!poolInfo) {
      throw new NotFoundException('Pool not found');
    }

    const tokenIn: TCoinMetadata = {
      address: poolInfo.tokenQuote.address,
      decimals: poolInfo.tokenQuote.decimals,
      name: poolInfo.tokenQuote.name,
      symbol: poolInfo.tokenQuote.symbol,
    };

    const tokenOut: TCoinMetadata = {
      address: poolInfo.tokenBase.address,
      decimals: poolInfo.tokenBase.decimals,
      name: poolInfo.tokenBase.name,
      symbol: poolInfo.tokenBase.symbol,
    };

    const dexInstance = FactoryDexUtils.getDexInstance(poolInfo.dex.dex as EDex);
    const uniqueId = this.snowflake.getUniqueID();
    const txBuyParams = await dexInstance.buildBuyParams({
      walletAddress: params.walletAddress,
      tokenIn,
      tokenOut,
      poolId: params.poolId,
      amountIn: params.amountIn,
      slippage: params.slippage ?? 100,
      orderId: uniqueId.toString(),
    });

    const txBuy = await dexInstance.buildBuyTransaction(txBuyParams);

    const txData = await txBuy.toJSON();

    const [orderBuy] = await this.orderBuyModel.create(
      [
        {
          userId: params.userId,
          walletAddress: params.walletAddress,
          poolId: params.poolId,
          amountIn: new Decimal128(params.amountIn),
          slippage: params.slippage,
          tokenIn,
          tokenOut,
          txData,
          timestamp: TimeUtils.nowInSeconds(),
          status: OrderBuyStatus.PENDING,
          requestId: uniqueId.toString(),
        },
      ],
      { session },
    );

    const res: IWsOrderReqPayload = {
      requestId: orderBuy.requestId,
      txData,
      orderSide: EOrderSide.BUY,
    };

    this.socketEmitterService.emitToUser(params.userId, SocketEvent.ORDER_REQUEST, res);

    return res;
  }

  async executeOrderBuy(
    params: { userId: string; requestId: string; signature: string },
    session: ClientSession,
  ): Promise<OrderBuyDocument> {
    const orderBuyRequest = await this.orderBuyModel.findOne(
      { requestId: params.requestId, userId: params.userId },
      null,
      {
        session,
      },
    );
    if (!orderBuyRequest) {
      throw new Error('OrderBuyRequest not found');
    }

    const txResult = await SuiClientUtils.executeTransaction(orderBuyRequest.txData, params.signature);
    const txHash = txResult.digest;
    const errors = txResult.errors;
    this.logger.info(`Tx buy executed: ${txHash}`);

    let status = OrderBuyStatus.SUCCESS;
    if (errors && errors.length > 0) {
      status = OrderBuyStatus.FAILED;
    }

    const orderBuy = await this.orderBuyModel.findOneAndUpdate(
      { requestId: params.requestId },
      { txHash, status },
      { session, new: true },
    );

    // save tx
    const tx = transformOrderBuyToTx(orderBuyRequest, txResult, txHash);
    await this.txService.createTx(tx, session);

    const wsOrderResultPayload: IWsOrderResultPayload = {
      requestId: params.requestId,
      orderSide: EOrderSide.BUY,
      txHash,
      status,
    };
    this.socketEmitterService.emitToUser(orderBuy.userId, SocketEvent.ORDER_RESULT, wsOrderResultPayload);

    return orderBuy;
  }

  async getBuyByUserId(userId: string, requestId: string): Promise<OrderBuyDocument> {
    const orderBuyRequest = await this.orderBuyModel.findOne({ requestId, userId });
    if (!orderBuyRequest) {
      throw new NotFoundException('OrderBuyRequest not found');
    }

    return orderBuyRequest;
  }

  async sellByUserId(
    userId: string,
    params: {
      poolId: string;
      percent: number;
      slippage: number;
    },
    session: ClientSession,
  ): Promise<OrderResDto> {
    const user = await this.userService.getUserById(userId, session);

    return this.sell(
      {
        userId,
        walletAddress: user.zkAddress,
        ...params,
      },
      session,
    );
  }

  async sell(
    params: {
      walletAddress: string;
      poolId: string;
      percent: number;
      slippage: number;
      userId: string;
    },
    session: ClientSession,
  ): Promise<OrderResDto> {
    const poolInfo = await this.raidenxProvider.common.getPoolInfo(params.poolId);
    if (!poolInfo) {
      throw new NotFoundException('Pool not found');
    }

    const tokenIn: TCoinMetadata = {
      address: poolInfo.tokenBase.address,
      decimals: poolInfo.tokenBase.decimals,
      name: poolInfo.tokenBase.name,
      symbol: poolInfo.tokenBase.symbol,
    };

    const tokenOut: TCoinMetadata = {
      address: poolInfo.tokenQuote.address,
      decimals: poolInfo.tokenQuote.decimals,
      name: poolInfo.tokenQuote.name,
      symbol: poolInfo.tokenQuote.symbol,
    };

    const dexInstance = FactoryDexUtils.getDexInstance(poolInfo.dex.dex as EDex);
    const totalAmountIn = await this.coinService.getCoinBalance(params.walletAddress, tokenIn.address);
    const amountIn = new BigNumber(totalAmountIn)
      .multipliedBy(params.percent)
      .dividedBy(100)
      .dividedBy(new BigNumber(10).pow(tokenIn.decimals))
      .decimalPlaces(tokenIn.decimals, BigNumber.ROUND_FLOOR)
      .toString();

    const uniqueId = this.snowflake.getUniqueID();
    const txSellParams = await dexInstance.buildSellParams({
      walletAddress: params.walletAddress,
      tokenIn,
      tokenOut,
      poolId: params.poolId,
      amountIn: amountIn,
      slippage: params.slippage ?? 100,
      orderId: uniqueId.toString(),
    });

    const txSell = await dexInstance.buildSellTransaction(txSellParams);

    const txData = await txSell.toJSON();

    const [orderSell] = await this.orderSellModel.create(
      [
        {
          requestId: uniqueId.toString(),
          userId: params.userId,
          walletAddress: params.walletAddress,
          poolId: params.poolId,
          percent: params.percent,
          amountIn: new Decimal128(amountIn),
          slippage: params.slippage,
          tokenIn,
          tokenOut,
          txData,
          timestamp: TimeUtils.nowInSeconds(),
          status: OrderSellStatus.PENDING,
        },
      ],
      { session },
    );

    const res: IWsOrderReqPayload = {
      requestId: orderSell.requestId,
      txData,
      orderSide: EOrderSide.SELL,
    };

    this.socketEmitterService.emitToUser(params.userId, SocketEvent.ORDER_REQUEST, res);

    return res;
  }

  async executeOrderSell(
    params: {
      userId: string;
      requestId: string;
      signature: string;
    },
    session: ClientSession,
  ): Promise<OrderSellDocument> {
    const orderSellRequest = await this.orderSellModel.findOne(
      { requestId: params.requestId, userId: params.userId },
      null,
      { session },
    );
    if (!orderSellRequest) {
      throw new Error('OrderSellRequest not found');
    }

    const txResult = await SuiClientUtils.executeTransaction(orderSellRequest.txData, params.signature);
    const txHash = txResult.digest;
    const errors = txResult.errors;
    this.logger.info(`Tx sell executed: ${txHash}`);

    let status = OrderSellStatus.SUCCESS;
    if (errors && errors.length > 0) {
      status = OrderSellStatus.FAILED;
    }

    const orderSell = await this.orderSellModel.findOneAndUpdate(
      { requestId: params.requestId },
      { txHash, status },
      { session, new: true },
    );

    // save tx
    const tx = transformOrderSellToTx(orderSellRequest, txResult, txHash);
    await this.txService.createTx(tx, session);

    const wsOrderResultPayload: IWsOrderResultPayload = {
      requestId: params.requestId,
      orderSide: EOrderSide.SELL,
      txHash,
      status,
    };
    this.socketEmitterService.emitToUser(orderSellRequest.userId, SocketEvent.ORDER_RESULT, wsOrderResultPayload);

    return orderSell;
  }

  async getSellByUserId(userId: string, requestId: string): Promise<OrderSellDocument> {
    const orderSellRequest = await this.orderSellModel.findOne({ requestId, userId });
    if (!orderSellRequest) {
      throw new NotFoundException('OrderSellRequest not found');
    }

    return orderSellRequest;
  }
}
