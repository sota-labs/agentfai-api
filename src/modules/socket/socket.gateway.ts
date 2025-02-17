import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { OrderSide } from 'common/constants/order';
import { LoggerUtils } from 'common/utils/logger.utils';
import { MongoUtils } from 'common/utils/mongo.utils';
import { OrderService } from 'modules/order/order.service';
import { SocketEvent } from 'modules/socket/socket.constant';
import { Connection } from 'mongoose';
import { Socket } from 'socket.io';

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
    console.log('client: ', client.handshake.auth.authorization);
    console.log('token: ', token);

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
    const authHeader = client.handshake.query?.authorization || client.handshake.auth['authorization'];

    if (typeof authHeader !== 'string') {
      return undefined;
    }

    // Handle Bearer token format
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : authHeader;
  }

  @SubscribeMessage(SocketEvent.ORDER_SIGNATURE)
  async handleOrderSignature(data: { orderRequestId: string; signature: string; orderSide: OrderSide }): Promise<void> {
    this.logger.info(`Order signature: ${data}`);
    await MongoUtils.withTransaction(this.connection, async (session) => {
      if (data.orderSide === OrderSide.BUY) {
        await this.orderService.executeOrderBuy(data.orderRequestId, data.signature, session);
      } else {
        await this.orderService.executeOrderSell(data.orderRequestId, data.signature, session);
      }
    });
  }
}
