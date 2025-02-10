import { ConfigType, registerAs } from '@nestjs/config';

export const raidenxRegToken = 'raidenx';

const RaidenxConfig = registerAs(raidenxRegToken, () => ({
  oauth2Url: process.env.RAIDENX_OAUTH2_URL || 'https://api-oauth2.dextrade.bot',
  walletsUrl: process.env.RAIDENX_WALLETS_URL || 'https://api-wallets.dextrade.bot',
  insightUrl: process.env.RAIDENX_INSIGHT_URL || 'https://api-insight.dextrade.bot',
}));

export type IRaidenxConfig = ConfigType<typeof RaidenxConfig>;

export default RaidenxConfig;
