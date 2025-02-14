import { Injectable } from '@nestjs/common';
import { ApiCommonProvider } from 'modules/shared/providers/raidenx/api-common.provider';

@Injectable()
export class RaidenxProvider {
  common: ApiCommonProvider;

  constructor(common: ApiCommonProvider) {
    this.common = common;
  }
}
