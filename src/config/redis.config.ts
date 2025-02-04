import { ConfigType, registerAs } from '@nestjs/config';

const host = process.env.REDIS_HOST || 'localhost';
const port = +process.env.REDIS_PORT || 6379;
const password = process.env.REDIS_PASSWORD || '';
const db = +process.env.REDIS_DB || 0;
const url = `redis://:${password}@${host}:${port}/${db}`;
const isCluster = process.env.REDIS_IS_CLUSTER === 'true';

export const redisRegToken = 'redis';

const RedisConfig = registerAs(redisRegToken, () => ({
  host,
  port,
  password,
  db,
  url,
  isCluster,
}));

export type IRedisConfig = ConfigType<typeof RedisConfig>;

export default RedisConfig;
