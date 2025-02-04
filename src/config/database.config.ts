import { ConfigType, registerAs } from '@nestjs/config';

export const dbRegToken = 'database';

const databaseConfig = registerAs(dbRegToken, () => ({
  uri: process.env.MONGODB_URI,
  autoIndex: process.env.MONGODB_AUTO_INDEX === 'true',
}));

export type IDatabaseConfig = ConfigType<typeof databaseConfig>;

export default databaseConfig;
