import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { LoggerUtils } from 'common/utils/logger.utils';

@Injectable()
export class BaseProvider {
  protected logger = LoggerUtils.get(BaseProvider.name);
  protected httpService: HttpService;

  constructor(httpService: HttpService) {
    this.httpService = httpService;
  }

  protected async get(url: string, headers?: Record<string, any>, query?: Record<string, any>, throwError = false) {
    this.logger.info(`GET ${url}`, {
      headers,
      query,
    });
    try {
      const res = this.httpService.get(url, {
        headers,
        params: {
          ...(query || {}),
        },
      });

      const resOfObservable = await firstValueFrom(res);
      return resOfObservable.data;
    } catch (e) {
      this.logger.error(`Error when GET ${url}`, {
        headers,
        query,
        error: e.response?.data ?? e.message,
      });
      if (throwError) {
        throw e;
      }
      return null;
    }
  }

  protected async post(url: string, headers?: Record<string, any>, body?: Record<string, any>, throwError = false) {
    this.logger.info(`POST ${url}`, {
      headers,
      body,
    });
    try {
      const res = this.httpService.post(url, body, {
        headers,
      });

      const resOfObservable = await firstValueFrom(res);

      this.logger.info(`POST ${url}`, {
        headers,
        body,
        response: resOfObservable.data,
      });
      return resOfObservable.data;
    } catch (e) {
      this.logger.error(`Error when POST ${url}`, {
        headers,
        body,
        error: e.response?.data,
      });
      if (throwError) {
        throw e;
      }
      return null;
    }
  }
}
