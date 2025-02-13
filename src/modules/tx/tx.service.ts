import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import BigNumber from 'bignumber.js';
import { TxBuy, TxBuyDocument, TxBuyStatus } from 'modules/tx/schemas/tx-buy.schema';
import { TxBuyReqDto } from 'modules/tx/dtos/req.dto';
import { TxBuyResDto } from 'modules/tx/dtos/res.dto';
import { CoinMetadata } from 'modules/coin/schemas/coin-metadata';
import { SUI_TOKEN_METADATA } from 'common/constants/common';
import { LoggerUtils } from 'common/utils/logger.utils';
import { SuiClientUtils } from 'common/utils/onchain/sui-client';
import { CetusDexUtils } from 'common/utils/dexes/cetus.dex.utils';
import { TimeUtils } from 'common/utils/time.utils';
import { CoinService } from 'modules/coin/coin.service';

@Injectable()
export class TxService {
  private readonly logger = LoggerUtils.get(TxService.name);
  constructor(
    @InjectModel(TxBuy.name) private readonly txBuyModel: Model<TxBuyDocument>,
    private readonly coinService: CoinService,
  ) {}

  private async _getTokenIn(tokenIn?: string): Promise<CoinMetadata> {
    this.logger.info(`Getting token in: ${tokenIn}`);
    if (!tokenIn) {
      return SUI_TOKEN_METADATA;
    }

    // TODO: Get token in from coin service
    throw new Error('Not implemented');
  }

  async buy(txBuyReqDto: TxBuyReqDto, session: ClientSession): Promise<TxBuyResDto> {
    const tokenIn = await this._getTokenIn(txBuyReqDto.tokenIn);
    const exactAmountIn = new BigNumber(txBuyReqDto.amountIn).times(10 ** tokenIn.decimals).toString();

    const buyTx = await CetusDexUtils.buildBuyTransaction({
      walletAddress: txBuyReqDto.walletAddress,
      exactAmountIn,
      gasBasePrice: await SuiClientUtils.getReferenceGasPrice(),
      poolObjectId: txBuyReqDto.poolId,
      tokenIn,
    });

    const txData = await buyTx.toJSON();

    const [txBuy] = await this.txBuyModel.create(
      [
        {
          walletAddress: txBuyReqDto.walletAddress,
          poolId: txBuyReqDto.poolId,
          amountIn: exactAmountIn,
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

    // TODO: emit res to client by socket
    // client will be construct transaction by txData and then sign transaction by private key
    // client will send signature to server by socket
    // server will listen signature from client
    // server will send signed transaction to onchain
    // server will emit event success or failed to client by socket

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

    return txHash;
  }
}
