import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { UserId } from 'common/decorators/user-id.decorator';
import { MongoUtils } from 'common/utils/mongo.utils';
import { OrderBuyReqDto, OrderSellReqDto, SignatureReqDto } from 'modules/order/dtos/req.dto';
import { OrderBuyResDto, OrderResDto, OrderSellResDto } from 'modules/order/dtos/res.dto';
import { OrderService } from 'modules/order/order.service';

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
  @ApiOperation({ summary: 'Get order buy by request ID' })
  @ApiOkResponse({ type: OrderBuyResDto })
  async getBuyRequest(@UserId() userId: string, @Param('requestId') requestId: string): Promise<OrderBuyResDto> {
    const orderBuy = await this.orderService.getBuyByUserId(userId, requestId);

    return plainToInstance(OrderBuyResDto, orderBuy.toObject());
  }

  @Post('buy/:requestId/signature')
  @ApiOperation({ summary: 'Execute order buy by request ID' })
  @ApiOkResponse({ type: OrderBuyResDto })
  async executeOrderBuy(
    @UserId() userId: string,
    @Param('requestId') requestId: string,
    @Body() signatureReqDto: SignatureReqDto,
  ): Promise<OrderBuyResDto> {
    return MongoUtils.withTransaction(this.connection, async (session) => {
      const orderBuy = await this.orderService.executeOrderBuy(
        {
          userId,
          requestId,
          signature: signatureReqDto.signature,
        },
        session,
      );

      return plainToInstance(OrderBuyResDto, orderBuy.toObject());
    });
  }

  @Post('sell')
  @ApiOperation({ summary: 'Sell a token' })
  @ApiOkResponse({ type: OrderResDto })
  async sell(@UserId() userId: string, @Body() orderSellReqDto: OrderSellReqDto): Promise<OrderResDto> {
    return MongoUtils.withTransaction(this.connection, async (session) => {
      return this.orderService.sellByUserId(userId, orderSellReqDto, session);
    });
  }

  @Get('sell/:requestId')
  @ApiOperation({ summary: 'Get order sell by request ID' })
  @ApiOkResponse({ type: OrderSellResDto })
  async getSellRequest(@UserId() userId: string, @Param('requestId') requestId: string): Promise<OrderSellResDto> {
    const orderSell = await this.orderService.getSellByUserId(userId, requestId);

    return plainToInstance(OrderSellResDto, orderSell.toObject());
  }

  @Post('sell/:requestId/signature')
  @ApiOperation({ summary: 'Execute order sell by request ID' })
  @ApiOkResponse({ type: OrderSellResDto })
  async executeOrderSell(
    @UserId() userId: string,
    @Param('requestId') requestId: string,
    @Body() signatureReqDto: SignatureReqDto,
  ): Promise<OrderSellResDto> {
    return MongoUtils.withTransaction(this.connection, async (session) => {
      const orderSell = await this.orderService.executeOrderSell(
        {
          userId,
          requestId,
          signature: signatureReqDto.signature,
        },
        session,
      );

      return plainToInstance(OrderSellResDto, orderSell.toObject());
    });
  }
}
