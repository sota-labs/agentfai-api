import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Connection } from 'mongoose';
import { Socket } from 'socket.io';
import { LoggerUtils } from 'common/utils/logger.utils';
import { MongoUtils } from 'common/utils/mongo.utils';
import { OrderService } from 'modules/order/order.service';
import { SocketEvent } from 'modules/socket/socket.constant';

@Injectable()
@WebSocketGateway({
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = LoggerUtils.get(SocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.info(`Client disconnected: ${client.id}`);
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = this._extractTokenFromSocket(client);

    if (token) {
      try {
        const { userId }: any = this.jwtService.verify(token);

        const room = this._selfRoom(userId);
        this.logger.info(`ClientId ${client.id} connected room: ${room}`);
        client.join(room);
      } catch (e) {
        this.logger.info(`Failed to decode access token for client ${client.id}`);
      }
    } else {
      this.logger.info(`Guest connected: ${client.id}`);
    }
  }

  private _selfRoom(userId: string): string {
    return `USER::${userId}`;
  }

  private _extractTokenFromSocket(client: Socket): string | undefined {
    const authHeader =
      client.handshake.query?.authorization ||
      client.handshake.headers['authorization'] ||
      client.handshake.auth['authorization'];

    if (typeof authHeader !== 'string') {
      return undefined;
    }

    // Handle Bearer token format
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : authHeader;
  }

  @SubscribeMessage(SocketEvent.ORDER_BUY_SIGNATURE)
  async handleOrderBuySignature(data: { orderRequestId: string; signature: string }): Promise<void> {
    this.logger.info(`Order buy signature: ${data}`);
    await MongoUtils.withTransaction(this.connection, async (session) => {
      await this.orderService.executeOrderBuy(data.orderRequestId, data.signature, session);
    });
  }

  @SubscribeMessage(SocketEvent.ORDER_SELL_SIGNATURE)
  async handleOrderSellSignature(data: { orderRequestId: string; signature: string }): Promise<void> {
    this.logger.info(`Order sell signature: ${data}`);
    await MongoUtils.withTransaction(this.connection, async (session) => {
      await this.orderService.executeOrderSell(data.orderRequestId, data.signature, session);
    });
  }
}
