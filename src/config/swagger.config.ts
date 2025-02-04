import { ConfigType, registerAs } from '@nestjs/config';

export const swaggerRegToken = 'swagger';

const SwaggerConfig = registerAs(swaggerRegToken, () => ({
  title: `Api ${process.env.NODE_ENV} AgentFAI services`,
  description: 'Swagger documentation',
  version: process.env.SWAGGER_VERSION || '0.0.1',
  user: process.env.SWAGGER_USER || 'admin',
  password: process.env.SWAGGER_PASSWORD || '1',
  path: `/docs`.toLowerCase(),
  disabled: process.env.SWAGGER_DISABLED === 'true',
}));

export type ISwaggerConfig = ConfigType<typeof SwaggerConfig>;

export default SwaggerConfig;
