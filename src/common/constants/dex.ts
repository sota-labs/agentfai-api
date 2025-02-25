export enum EDex {
  CETUS = 'cetus',
  BLUEMOVE = 'bluemove',
  MOVEPUMP = 'movepump',
  FLOWX = 'flowx',
  TURBOSFINANCE = 'turbosfinance',
  TURBOSFUN = 'turbosfun',
  SEVENKFUN = 'sevenkfun',
  BLUEFIN = 'bluefin',
  SUIAI = 'suiai',
}

export const ROUTER_SWAP_EVENT = 'SwapEvent';
export const ROUTER_BUY_EVENT = 'BuyEvent';
export const ROUTER_SELL_EVENT = 'SellEvent';

export enum EOrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum ETxStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum ESwapEvent {
  BuyEvent = 'BuyEvent',
  SellEvent = 'SellEvent',
  SwapEvent = 'SwapEvent',
}

export enum ETransactionModule {
  SevenKFun = 'fun_7k_router',
  Suiai = 'suiai_router',
  Cetus = 'cetus_router',
  Bluemove = 'bluemove_router',
  FlowX = 'flow_x_router',
  MovePump = 'move_pump_router',
  Turbos = 'turbos_router',
  TurbosPump = 'turbospump_router',
  Bluefin = 'bluefin_router',
}

export const mappingDexToTransactionModule = (dex: EDex): ETransactionModule => {
  switch (dex) {
    case EDex.CETUS:
      return ETransactionModule.Cetus;
    case EDex.BLUEMOVE:
      return ETransactionModule.Bluemove;
    case EDex.FLOWX:
      return ETransactionModule.FlowX;
    case EDex.MOVEPUMP:
      return ETransactionModule.MovePump;
    case EDex.TURBOSFINANCE:
      return ETransactionModule.Turbos;
    case EDex.TURBOSFUN:
      return ETransactionModule.TurbosPump;
    case EDex.SEVENKFUN:
      return ETransactionModule.SevenKFun;
    case EDex.BLUEFIN:
      return ETransactionModule.Bluefin;
    case EDex.SUIAI:
      return ETransactionModule.Suiai;
  }
};
