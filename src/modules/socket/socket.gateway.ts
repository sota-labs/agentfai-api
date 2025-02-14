import { Inject, forwardRef, Injectable } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { LoggerUtils } from 'common/utils/logger.utils';
import { SocketEvent } from 'modules/socket/socket.constant';
import { TxService } from 'modules/tx/tx.service';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { MongoUtils } from 'common/utils/mongo.utils';
@Injectable()
@WebSocketGateway({
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = LoggerUtils.get(SocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => TxService))
    private readonly txService: TxService,
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

  @SubscribeMessage(SocketEvent.TX_SIGNATURE)
  async handleTxSignature(data: { txRequestId: string; signature: string }): Promise<void> {
    this.logger.info(`Tx signature: ${data}`);
    await MongoUtils.withTransaction(this.connection, async (session) => {
      await this.txService.executeTxBuy(data.txRequestId, data.signature, session);
    });
  }
}
