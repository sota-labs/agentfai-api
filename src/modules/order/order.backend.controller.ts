import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ApiKeyAuth } from 'common/decorators/api-key-auth.decorator';
import { Backend } from 'common/decorators/backend.decorator';
import { ExecuteOrderBuyReqDto, OrderBuyBackendReqDto } from 'modules/order/dtos/req.dto';
import { ExecuteOrderBuyResDto, OrderBuyResDto, OrderResDto } from 'modules/order/dtos/res.dto';
import { OrderService } from 'modules/order/order.service';

@ApiTags('Order')
@Controller({
  path: '/backend/order',
  version: '1',
})
@ApiKeyAuth()
export class OrderBackendController {
  constructor(private readonly orderService: OrderService) {}

  @Post('buy')
  @Backend()
  @ApiOperation({ summary: 'Buy a token' })
  @ApiOkResponse({ type: OrderBuyResDto })
  async buy(@Body() orderBuyReqDto: OrderBuyBackendReqDto): Promise<OrderResDto> {
    return this.orderService.buy(orderBuyReqDto, null);
  }

  @Post('execute-order-buy')
  @Backend()
  @ApiOperation({ summary: 'Execute a order buy' })
  @ApiOkResponse({ type: ExecuteOrderBuyResDto })
  async executeOrderBuy(@Body() reqBody: ExecuteOrderBuyReqDto): Promise<ExecuteOrderBuyResDto> {
    const txHash = await this.orderService.executeOrderBuy(reqBody.orderRequestId, reqBody.signature, null);
    return plainToInstance(ExecuteOrderBuyResDto, {
      txHash,
    });
  }
}
