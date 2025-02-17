import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IPagination } from 'common/decorators/paginate.decorator';
import { LoggerUtils } from 'common/utils/logger.utils';
import { GetAllTxQuery } from 'modules/tx/dtos/get-all-txs.dto';
import { Tx, TxDocument } from 'modules/tx/schemas/tx.schema';
import { ClientSession, FilterQuery, PaginateModel, PaginateResult } from 'mongoose';
@Injectable()
export class TxService {
  private readonly logger = LoggerUtils.get(TxService.name);
  constructor(
    @InjectModel(Tx.name)
    private readonly txModel: PaginateModel<TxDocument>,
  ) {}

  async paginate(userId: string, query: GetAllTxQuery, paginate: IPagination): Promise<PaginateResult<TxDocument>> {
    const { type, requestId, poolId, tokenSymbol, txHash, walletAddress } = query;
    const filter = {} as Partial<FilterQuery<TxDocument>>;

    if (type) {
      filter.type = type;
    }

    if (requestId) {
      filter.requestId = requestId;
    }

    if (poolId) {
      filter.payload.poolId = poolId;
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

    const [paginateResult, totalCount] = await Promise.all([
      this.txModel.paginate({ userId, ...filter }, { ...paginate }),
      this.txModel.countDocuments({ userId, ...filter }),
    ]);

    return { ...paginateResult, totalCount };
  }

  async createTx(tx: Tx, session?: ClientSession) {
    return this.txModel.create([tx], { session });
  }
}
