import { EDex } from 'common/constants/dex';
import { CetusDexUtils } from 'common/utils/dexes/cetus.dex.utils';
import { BluemoveDexUtils } from 'common/utils/dexes/bluemove.dex.utils';
import { MovepumpDexUtils } from 'common/utils/dexes/movepump.dex.utils';
import { FlowxDexUtils } from 'common/utils/dexes/flowx.dex.utils';
import { TurbosDexUtils } from 'common/utils/dexes/turbos.dex.utils';
import { TurbosFunDexUtils } from 'common/utils/dexes/turbosfun.dex.utils';
import { SevenkfunDexUtils } from 'common/utils/dexes/sevenkfun.dex.utils';
import { BluefinDexUtils } from 'common/utils/dexes/bluefin.dex.utils';
import { SuiAiDexUtils } from 'common/utils/dexes/suiai.dex.utils';
import { IDexUtils } from 'common/utils/dexes/base.dex.utils';

export class FactoryDexUtils {
  static getDexInstance(dex: EDex): IDexUtils {
    switch (dex) {
      case EDex.CETUS:
        return new CetusDexUtils();
      case EDex.BLUEMOVE:
        return new BluemoveDexUtils();
      case EDex.MOVEPUMP:
        return new MovepumpDexUtils();
      case EDex.FLOWX:
        return new FlowxDexUtils();
      case EDex.TURBOSFINANCE:
        return new TurbosDexUtils();
      case EDex.TURBOSFUN:
        return new TurbosFunDexUtils();
      case EDex.SEVENKFUN:
        return new SevenkfunDexUtils();
      case EDex.BLUEFIN:
        return new BluefinDexUtils();
      case EDex.SUIAI:
        return new SuiAiDexUtils();
      default:
        throw new Error(`Unsupported dex: ${dex}`);
    }
  }
}
