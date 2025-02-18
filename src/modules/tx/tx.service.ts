import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, PaginateModel, PaginateResult } from 'mongoose';
import { IPagination } from 'common/decorators/paginate.decorator';
import { LoggerUtils } from 'common/utils/logger.utils';
import { GetAllTxQuery } from 'modules/tx/dtos/get-all-txs.dto';
import { Tx, TxDocument } from 'modules/tx/schemas/tx.schema';

@Injectable()
export class TxService {
  private readonly logger = LoggerUtils.get(TxService.name);
  constructor(
    @InjectModel(Tx.name)
    private readonly txModel: PaginateModel<TxDocument>,
  ) {}

  async paginate(userId: string, query: GetAllTxQuery, paginate: IPagination): Promise<PaginateResult<TxDocument>> {
    const { type, requestId, poolId, tokenSymbol, txHash, walletAddress, dex } = query;
    const filter = {} as Partial<FilterQuery<TxDocument>>;

    if (type) {
      filter.type = type;
    }

    if (requestId) {
      filter.requestId = requestId;
    }

    if (poolId) {
      filter['payload.poolId'] = poolId;
    }

    if (tokenSymbol) {
      filter['payload.tokenIn.symbol'] = tokenSymbol;
    }

    if (txHash) {
      filter.txHash = txHash;
    }

    if (walletAddress) {
      filter['payload.walletAddress'] = walletAddress;
    }

    if (dex) {
      filter['payload.dex'] = dex;
    }

    return this.txModel.paginate({ userId, ...filter }, { ...paginate });
  }

  async createTx(tx: Tx, session?: ClientSession) {
    return this.txModel.create([tx], { session });
  }
}
