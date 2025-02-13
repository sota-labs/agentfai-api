import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Public } from 'common/decorators/public.decorator';
import { CoinService } from 'modules/coin/coin.service';
import { ListCoinMetadataResDto } from 'modules/coin/dto/res';

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
    type: ListCoinMetadataResDto,
  })
  @Public()
  @ApiQuery({
    name: 'nextCursor',
    type: String,
    required: false,
    description: 'Next cursor',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Limit',
  })
  async getPortfolio(
    @Param('walletAddress') walletAddress: string,
    @Query('nextCursor') nextCursor: string,
    @Query('limit') limit: string,
  ): Promise<ListCoinMetadataResDto> {
    const result = await this.coinService.getPortfolio(walletAddress, {
      nextCursor,
      limit: limit ? +limit : undefined,
    });
    return plainToInstance(ListCoinMetadataResDto, result);
  }
}
