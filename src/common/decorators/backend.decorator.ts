import { SetMetadata } from '@nestjs/common';

export const IS_BACKEND_KEY = 'isBackend';
export const Backend = () => SetMetadata(IS_BACKEND_KEY, true);
