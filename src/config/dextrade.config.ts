import { ConfigType, registerAs } from '@nestjs/config';

export const raidexRegToken = 'raidex';

const RaidenxConfig = registerAs(raidexRegToken, () => ({
  oauth2Url: process.env.OAUTH2_URL || 'https://api-oauth2.dextrade.bot',
}));

export type IRaidenxConfig = ConfigType<typeof RaidenxConfig>;

export default RaidenxConfig;
