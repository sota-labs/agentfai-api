import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UserId } from 'common/decorators/user-id.decorator';
import { MongoUtils } from 'common/utils/mongo.utils';
import { OrderBuyReqDto } from 'modules/order/dtos/req.dto';
import { OrderBuyResDto, OrderResDto } from 'modules/order/dtos/res.dto';
import { OrderService } from 'modules/order/order.service';
import { Connection } from 'mongoose';

@ApiTags('Order')
@Controller({
  path: 'order',
  version: '1',
})
@ApiBearerAuth()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  @Post('buy')
  @ApiOperation({ summary: 'Buy a token' })
  @ApiOkResponse({ type: OrderResDto })
  async buy(@UserId() userId: string, @Body() orderBuyReqDto: OrderBuyReqDto): Promise<OrderResDto> {
    return MongoUtils.withTransaction(this.connection, async (session) => {
      return this.orderService.buyByUserId(userId, orderBuyReqDto, session);
    });
  }

  @Get('buy/:requestId')
  @ApiOperation({ summary: 'Get a transaction by request ID' })
  @ApiOkResponse({ type: OrderBuyResDto })
  async getBuyRequest(@UserId() userId: string, @Param('requestId') requestId: string): Promise<OrderBuyResDto> {
    const orderBuy = await this.orderService.getBuyByUserId(userId, requestId);

    return plainToInstance(OrderBuyResDto, orderBuy.toObject());
  }
}
