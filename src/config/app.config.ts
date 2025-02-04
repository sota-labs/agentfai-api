import { ConfigType, registerAs } from '@nestjs/config';
import { ENetwork } from 'common/constants/network';

export const appRegToken = 'app';

const network = process.env.NETWORK?.toLowerCase() || 'sui';
const AppConfig = registerAs(appRegToken, () => ({
  env: process.env.NODE_ENV || 'local',
  port: process.env.API_PORT || 3000,
  prefixUrl: `api`.toLowerCase(),
  jwt: {
    secret: process.env.JWT_ACCESS_SECRET_KEY || 'secret',
  },
  network,
  dextradeUrl: process.env.DEXTRADE_URL || 'https://api.dextrade.bot/api/v1',
  websiteUrl: process.env.WEBSITE_URL,
  maxActivePairAlertSettings: process.env.MAX_ACTIVE_PAIR_ALERT_SETTINGS
    ? Number(process.env.MAX_ACTIVE_PAIR_ALERT_SETTINGS)
    : 10,
  maxActiveWalletAlertSettings: process.env.MAX_ACTIVE_WALLET_ALERT_SETTINGS
    ? Number(process.env.MAX_ACTIVE_WALLET_ALERT_SETTINGS)
    : 5,
  priceAlertCooldown: process.env.PRICE_ALERT_COOLDOWN ? Number(process.env.PRICE_ALERT_COOLDOWN) : 60,
  walletAlertCooldown: process.env.WALLET_ALERT_COOLDOWN ? Number(process.env.WALLET_ALERT_COOLDOWN) : 30,
}));

if (!Object.values(ENetwork).includes(network as ENetwork)) {
  throw new Error(`Invalid network: ${network}`);
}

export type IAppConfig = ConfigType<typeof AppConfig>;

export default AppConfig;
