import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { TxService } from 'modules/tx/tx.service';
import { TxBuyResDto, TxResDto } from 'modules/tx/dtos/res.dto';
import { TxBuyReqDto } from 'modules/tx/dtos/req.dto';
import { UserId } from 'common/decorators/user-id.decorator';
import { MongoUtils } from 'common/utils/mongo.utils';

@ApiTags('Tx')
@Controller({
  path: 'tx',
  version: '1',
})
@ApiBearerAuth()
export class TxController {
  constructor(
    private readonly txService: TxService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  @Post('buy')
  @ApiOperation({ summary: 'Buy a token' })
  @ApiOkResponse({ type: TxResDto })
  async buy(@UserId() userId: string, @Body() txBuyReqDto: TxBuyReqDto): Promise<TxResDto> {
    return MongoUtils.withTransaction(this.connection, async (session) => {
      return this.txService.buyByUserId(userId, txBuyReqDto, session);
    });
  }

  @Get('buy/:requestId')
  @ApiOperation({ summary: 'Get a transaction by request ID' })
  @ApiOkResponse({ type: TxBuyResDto })
  async getBuyRequest(@UserId() userId: string, @Param('requestId') requestId: string): Promise<TxBuyResDto> {
    const tx = await this.txService.getBuyByUserId(userId, requestId);

    return plainToInstance(TxBuyResDto, tx.toObject());
  }
}
