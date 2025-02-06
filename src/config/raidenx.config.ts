import { ConfigType, registerAs } from '@nestjs/config';

export const raidenxRegToken = 'raidenx';

const RaidenxConfig = registerAs(raidenxRegToken, () => ({
  oauth2Url: process.env.RAIDENX_OAUTH2_URL || 'https://api-oauth2.dextrade.bot',
}));

export type IRaidenxConfig = ConfigType<typeof RaidenxConfig>;

export default RaidenxConfig;
