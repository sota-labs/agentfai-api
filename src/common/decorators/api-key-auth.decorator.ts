import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ApiBearerAuth, ApiHeader, ApiQuery } from '@nestjs/swagger';

export function ApiKeyAuth() {
  return applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiBearerAuth(),
    ApiHeader({
      name: 'X-API-KEY',
      description: 'API key for authentication',
      required: false,
    }),
    ApiQuery({
      name: 'apiKey',
      description: 'API key for authentication',
      required: false,
    }),
  );
}
