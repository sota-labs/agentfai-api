import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { ApiPaginationQuery, IPagination, Pagination } from 'common/decorators/paginate.decorator';
import { UserId } from 'common/decorators/user-id.decorator';
import { GetAllTxQuery, PaginateTxsDto } from 'modules/tx/dtos/get-all-txs.dto';
import { TxService } from 'modules/tx/tx.service';

@ApiTags('Tx')
@Controller({
  path: 'tx',
  version: '1',
})
@ApiBearerAuth()
export class TxController {
  constructor(private readonly txService: TxService) {}

  @Get('')
  @ApiOperation({ summary: 'Get all txs by user id' })
  @ApiResponse({
    status: 200,
    description: 'Txs fetched successfully',
    type: PaginateTxsDto,
  })
  @ApiPaginationQuery()
  async paginate(
    @UserId() userId: string,
    @Query() query: GetAllTxQuery,
    @Pagination() paginate: IPagination,
  ): Promise<PaginateTxsDto> {
    const results = await this.txService.paginate(userId, query, paginate);
    return plainToClass(PaginateTxsDto, results);
  }
}
