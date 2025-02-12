import { ConfigType, registerAs } from '@nestjs/config';
import { ENetwork } from 'common/constants/network';

export const appRegToken = 'app';

const network = process.env.NETWORK?.toLowerCase() || 'sui';
const AppConfig = registerAs(appRegToken, () => ({
  env: process.env.NODE_ENV || 'local',
  port: process.env.API_PORT || 3000,
  prefixUrl: `api`.toLowerCase(),
  crypto: {
    secretKey: process.env.CRYPTO_SECRET_KEY || 'VERvizMry2DfC4QZiICzatwFwftJgvYC',
  },
  fullnodeSuiUrl: process.env.FULLNODE_SUI_URL,
}));

if (!Object.values(ENetwork).includes(network as ENetwork)) {
  throw new Error(`Invalid network: ${network}`);
}

export type IAppConfig = ConfigType<typeof AppConfig>;

export default AppConfig;
