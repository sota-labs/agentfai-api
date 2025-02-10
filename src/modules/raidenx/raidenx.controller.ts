import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IPositionRes, IUserWallet } from 'modules/raidenx/interfaces';
import { RaidenxService } from 'modules/raidenx/raidenx.service';
import { UserId } from 'common/decorators/user-id.decorator';
import { IPagination, Pagination } from 'common/decorators/paginate.decorator';
import { ApiPaginationQuery } from 'common/decorators/paginate.decorator';
import { GetPositionsReq } from 'modules/raidenx/dtos/req.dto';

@Controller({
  path: 'raidenx',
  version: '1',
})
@ApiTags('RaidenX')
@ApiBearerAuth()
export class RaidenxController {
  constructor(private readonly raidenxService: RaidenxService) {}

  @Get('wallets')
  async getWallets(@UserId() userId: string): Promise<IUserWallet[]> {
    return this.raidenxService.getWallets(userId);
  }

  @Get('positions')
  @ApiPaginationQuery()
  async getPositions(
    @UserId() userId: string,
    @Query() query: GetPositionsReq,
    @Pagination() pagination: IPagination,
  ): Promise<IPositionRes[]> {
    return this.raidenxService.getPositions(userId, query, pagination);
  }
}
