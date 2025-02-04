import { Test, TestingModule } from '@nestjs/testing';
import { TradeService } from 'modules/trade/trade.service';
import { PairTradeService } from 'modules/traders/pair-trade.service';
import { HolderService } from 'modules/holder/holder.service';
import { UserStatisticService } from 'modules/user-statistic/user-statistic.service';
import { DataSource } from 'typeorm';
import { IDexTradeTx } from 'common/interfaces/kafka';
import { TradeTxConsumer } from 'starters/trade-tx.consumer';

const msg1 = {
  hash: '0xbfe3739792cd85b1e608be27f35d959c6561d051b968a576a9edb3dcd543b0b6',
  index: 0,
  timestamp: 1727778198,
  userId: '1',
  sender: '0x961a1970bf3c2d2f1b460c1b7b3cf75f37fab892815e2cbacc89e5947272dbc6',
  pair: 'liquids_lsd_apt_uncorrelated',
  token: {
    address: '0x53a30a6e5936c0a4c5140daed34de39d17ca7fcae08f947c02e979cef98a3719::coin::LSD',
    name: 'LSD',
    symbol: 'LSD',
    decimals: 8,
  },
  baseAmount: '420',
  quoteAmount: '19.39777531',
  isBuy: false,
  volumeUsd: '159.4497130482',
  price: '0.046059948936719095',
  priceUsd: '0.37861278025983097',
};

const msg2 = {
  hash: '0xbfe3739792cd85b1e608be27f35d959c6561d051b968a576a9edb3dcd543b0b6',
  index: 2,
  timestamp: 1727778198,
  userId: '1',
  sender: '0x961a1970bf3c2d2f1b460c1b7b3cf75f37fab892815e2cbacc89e5947272dbc6',
  pair: 'liquids_doodoo_apt_uncorrelated',
  token: {
    address: '0x73eb84966be67e4697fc5ae75173ca6c35089e802650f75422ab49a8729704ec::coin::DooDoo',
    name: 'DOODOO',
    symbol: 'doodoo',
    decimals: 8,
  },
  baseAmount: '389.74124519',
  quoteAmount: '14.78106828',
  isBuy: false,
  volumeUsd: '121.50038126160001',
  price: '0.03791733032624087',
  priceUsd: '0.31168045528169996',
};

describe('TradeTxConsumer', () => {
  let tradeTxConsumer: TradeTxConsumer;
  let tradeService: TradeService;
  let holderService: HolderService;
  let pairTradeService: PairTradeService;
  let userStatisticService: UserStatisticService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeTxConsumer,
        {
          provide: TradeService,
          useValue: {
            getByHashes: jest.fn(),
            createMany: jest.fn(),
          },
        },
        {
          provide: HolderService,
          useValue: { trade: jest.fn() },
        },
        {
          provide: PairTradeService,
          useValue: { trade: jest.fn() },
        },
        {
          provide: UserStatisticService,
          useValue: { trade: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    tradeTxConsumer = module.get<TradeTxConsumer>(TradeTxConsumer);
    tradeService = module.get<TradeService>(TradeService);
    holderService = module.get<HolderService>(HolderService);
    pairTradeService = module.get<PairTradeService>(PairTradeService);
    userStatisticService = module.get<UserStatisticService>(UserStatisticService);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('filterNewTrades', () => {
    it('should filter out existing trades by hash and index', async () => {
      const trades: IDexTradeTx[] = [msg1, msg2];

      const existingTrades = [{ hash: msg1.hash, index: msg1.index }];
      jest.spyOn(tradeService, 'getByHashes').mockResolvedValue(existingTrades);

      const result = await tradeTxConsumer.filterNewTrades(trades);

      expect(tradeService.getByHashes).toHaveBeenCalledWith(trades.map((trade) => trade.hash));
      expect(result).toEqual([msg2]);
    });
  });

  describe('eachBatch', () => {
    it('should process new trades and call related services', async () => {
      const trades: IDexTradeTx[] = [msg1, msg2];
      const newTrades = [msg2];
      jest.spyOn(tradeTxConsumer, 'filterNewTrades').mockResolvedValue(newTrades);

      const transactionSpy = jest.fn(async (callback: any) => {
        await callback({});
      });
      jest.spyOn(dataSource, 'transaction').mockImplementation(transactionSpy);

      await tradeTxConsumer.eachBatch(trades);

      expect(tradeTxConsumer.filterNewTrades).toHaveBeenCalledWith(trades);
      expect(holderService.trade).toHaveBeenCalledWith(newTrades, expect.anything());
      expect(tradeService.createMany).toHaveBeenCalledWith(newTrades, expect.anything());
      expect(pairTradeService.trade).toHaveBeenCalledWith(newTrades, expect.anything());
      expect(userStatisticService.trade).toHaveBeenCalledWith(newTrades, expect.anything());
    });
  });
});
