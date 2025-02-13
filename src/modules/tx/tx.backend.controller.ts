import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ApiKeyAuth } from 'common/decorators/api-key-auth.decorator';
import { Backend } from 'common/decorators/backend.decorator';
import { ExecuteTxBuyReqDto, TxBuyReqDto } from 'modules/tx/dtos/req.dto';
import { ExecuteTxBuyResDto, TxBuyResDto } from 'modules/tx/dtos/res.dto';
import { TxService } from 'modules/tx/tx.service';

@ApiTags('Tx')
@Controller({
  path: 'tx',
  version: '1',
})
@ApiKeyAuth()
export class TxBackendController {
  constructor(private readonly txService: TxService) {}

  @Post('buy')
  @Backend()
  @ApiOperation({ summary: 'Buy a token' })
  @ApiOkResponse({ type: TxBuyResDto })
  async buy(@Body() txBuyReqDto: TxBuyReqDto): Promise<TxBuyResDto> {
    return this.txService.buy(txBuyReqDto, null);
  }

  @Post('execute-tx-buy')
  @Backend()
  @ApiOperation({ summary: 'Execute a tx buy' })
  @ApiOkResponse({ type: ExecuteTxBuyResDto })
  async executeTxBuy(@Body() reqBody: ExecuteTxBuyReqDto): Promise<ExecuteTxBuyResDto> {
    const txHash = await this.txService.executeTxBuy(reqBody.txRequestId, reqBody.signature, null);
    return plainToInstance(ExecuteTxBuyResDto, {
      txHash,
    });
  }
}
