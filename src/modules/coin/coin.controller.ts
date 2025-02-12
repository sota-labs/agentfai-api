import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'common/decorators/public.decorator';
import { CoinService } from './coin.service';
import { ApiPaginationQuery, IPagination, Pagination } from 'common/decorators/paginate.decorator';
import { PaginatedCoinMetadataResDto } from './dto/res';
import { plainToInstance } from 'class-transformer';

@Controller({
  path: 'coin',
  version: '1',
})
@ApiTags('Coins')
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @Get('/portfolio/:walletAddress')
  @ApiOperation({
    operationId: 'getPortfolio',
    summary: 'Get Portfolio',
    description: '',
  })
  @ApiOkResponse({
    type: PaginatedCoinMetadataResDto,
  })
  @Public()
  @ApiPaginationQuery()
  async getWallet(
    @Param('walletAddress') walletAddress: string,
    @Pagination() paginate: IPagination,
  ): Promise<PaginatedCoinMetadataResDto> {
    const result = await this.coinService.getPortfolio(walletAddress, paginate);
    return plainToInstance(PaginatedCoinMetadataResDto, result);
  }
}
