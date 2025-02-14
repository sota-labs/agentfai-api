import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import BigNumber from 'bignumber.js';
import { Decimal128 } from 'bson';
import { SUI_TOKEN_METADATA } from 'common/constants/common';
import { CetusDexUtils } from 'common/utils/dexes/cetus.dex.utils';
import { LoggerUtils } from 'common/utils/logger.utils';
import { SuiClientUtils } from 'common/utils/onchain/sui-client';
import { TimeUtils } from 'common/utils/time.utils';
import { CoinService } from 'modules/coin/coin.service';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';
import { SocketEmitterService } from 'modules/socket/socket-emitter.service';
import { SocketEvent } from 'modules/socket/socket.constant';
import { TxResDto } from 'modules/tx/dtos/res.dto';
import { TxBuy, TxBuyDocument, TxBuyStatus } from 'modules/tx/schemas/tx-buy.schema';
import { UserService } from 'modules/user/user.service';
import { ClientSession, Model } from 'mongoose';
@Injectable()
export class TxService {
  private readonly logger = LoggerUtils.get(TxService.name);
  constructor(
    @InjectModel(TxBuy.name) private readonly txBuyModel: Model<TxBuyDocument>,
    private readonly coinService: CoinService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => SocketEmitterService))
    private readonly socketEmitterService: SocketEmitterService,
  ) {}

  private async _getTokenIn(tokenIn?: string): Promise<CoinMetadata> {
    this.logger.info(`Getting token in: ${tokenIn}`);
    if (!tokenIn) {
      return SUI_TOKEN_METADATA;
    }

    // TODO: Get token in from coin service
    throw new Error('Not implemented');
  }

  async buyByUserId(
    userId: string,
    params: {
      tokenIn?: string;
      poolId: string;
      amountIn: string;
    },
    session: ClientSession,
  ): Promise<TxResDto> {
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
      userId: string;
    },
    session: ClientSession,
  ): Promise<TxResDto> {
    const tokenIn = await this._getTokenIn(params.tokenIn);
    const exactAmountIn = new BigNumber(params.amountIn).times(10 ** tokenIn.decimals).toString();

    // TODO: get pool info from raidenx
    // TODO: check if pool is valid
    // TODO: check if user has enough balance
    // TODO: select dex to build transaction

    const buyTx = await CetusDexUtils.buildBuyTransaction({
      walletAddress: params.walletAddress,
      exactAmountIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      poolObjectId: params.poolId,
      tokenIn,
    });

    const txData = await buyTx.toJSON();

    const [txBuy] = await this.txBuyModel.create(
      [
        {
          userId: params.userId,
          walletAddress: params.walletAddress,
          poolId: params.poolId,
          amountIn: new Decimal128(params.amountIn),
          tokenIn,
          txHash: null,
          txData,
          timestamp: TimeUtils.nowInSeconds(),
          status: TxBuyStatus.PENDING,
        },
      ],
      { session },
    );

    const res = {
      requestId: txBuy._id.toString(),
      txData,
    };

    this.socketEmitterService.emit(SocketEvent.TX_BUY_REQUEST, res);

    return res;
  }

  async executeTxBuy(txRequestId: string, signature: string, session: ClientSession): Promise<string> {
    const txBuyRequest = await this.txBuyModel.findById({ _id: txRequestId }, null, { session });
    if (!txBuyRequest) {
      throw new Error('TxBuyRequest not found');
    }

    const txResult = await SuiClientUtils.executeTransaction(txBuyRequest.txData, signature);
    const txHash = txResult.digest;
    const errors = txResult.errors;
    this.logger.info(`Tx buy executed: ${txHash}`);

    let status = TxBuyStatus.SUCCESS;
    if (errors && errors.length > 0) {
      status = TxBuyStatus.FAILED;
    }

    await this.txBuyModel.findByIdAndUpdate({ _id: txRequestId }, { txHash, status }, { session });
    // TODO: emit event success or failed to client by socket
    this.socketEmitterService.emitToUser(txBuyRequest.userId, SocketEvent.TX_BUY_RESULT, {
      txRequestId,
      txHash,
      status,
    });

    return txHash;
  }

  async getBuyByUserId(userId: string, requestId: string): Promise<TxBuyDocument> {
    const user = await this.userService.getUserById(userId);
    const txBuyRequest = await this.txBuyModel.findOne({ _id: requestId, walletAddress: user.zkAddress });
    if (!txBuyRequest) {
      throw new NotFoundException('TxBuyRequest not found');
    }

    return txBuyRequest;
  }
}
