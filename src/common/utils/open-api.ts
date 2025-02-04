import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';

export class OpenAPIUtils {
  static async build(app: INestApplication) {
    const configService = app.get(ConfigService);
    const swaggerDisabled = configService.get('swagger.disabled', false);

    if (swaggerDisabled) {
      return;
    }

    const swaggerUser = configService.get('swagger.user');
    const swaggerPassword = configService.get('swagger.password');
    if (swaggerUser && swaggerPassword) {
      app.use(
        [configService.getOrThrow<string>('swagger.path')],
        basicAuth({
          challenge: true,
          users: {
            [swaggerUser as string]: swaggerPassword,
          },
        }),
      );
    }

    const swaggerTitle = configService.getOrThrow<string>('swagger.title');
    const swaggerDescription = configService.getOrThrow<string>('swagger.description');
    const swaggerPath = configService.getOrThrow<string>('swagger.path');
    const swaggerVersion = configService.getOrThrow<string>('swagger.version');

    const options = new DocumentBuilder()
      .setTitle(swaggerTitle)
      .setDescription(swaggerDescription)
      .setVersion(swaggerVersion)
      .addBearerAuth()
      .addBasicAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(swaggerPath, app, document, {
      customSiteTitle: 'API swagger',
      jsonDocumentUrl: 'swagger/json',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}
