import dotenv from 'dotenv';
dotenv.config();

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import httpContext from 'express-http-context';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { OpenAPIUtils } from 'common/utils/open-api';
import { AllExceptionsFilter } from 'common/filters/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(httpContext.middleware);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: false,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  const configService = app.get(ConfigService);

  const prefixUrl = configService.getOrThrow<string>('app.prefixUrl');
  app.setGlobalPrefix(prefixUrl, {
    exclude: [`/health`],
  });

  app.enableVersioning({ type: VersioningType.URI });
  await OpenAPIUtils.build(app);
  app.use(helmet());

  const apiPort = configService.getOrThrow<number>('app.port');
  const swaggerPath = configService.getOrThrow<string>('swagger.path');

  await app.listen(apiPort, () => {
    console.log(`
      API: http://localhost:${apiPort}/${prefixUrl}
      Swagger: http://localhost:${apiPort}${swaggerPath}
    `);
  });
}

bootstrap();
