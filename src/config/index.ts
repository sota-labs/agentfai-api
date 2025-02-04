import appConfig, { appRegToken, IAppConfig } from './app.config';
import databaseConfig, { dbRegToken, IDatabaseConfig } from './database.config';
import swaggerConfig, { ISwaggerConfig, swaggerRegToken } from './swagger.config';
import redisConfig, { redisRegToken, IRedisConfig } from './redis.config';
import authConfig, { authRegToken, IAuthConfig } from './auth.config';

export interface AllConfigType {
  [appRegToken]: IAppConfig;
  [authRegToken]: IAuthConfig;
  [dbRegToken]: IDatabaseConfig;
  [swaggerRegToken]: ISwaggerConfig;
  [redisRegToken]: IRedisConfig;
}

type RecordNamePaths<T> = T extends object
  ? {
      [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${RecordNamePaths<T[K]>}` : K) : never;
    }[keyof T]
  : never;

export type ConfigKeyPaths = RecordNamePaths<AllConfigType>;

const configs = [appConfig, authConfig, databaseConfig, swaggerConfig, redisConfig];

export default configs;
