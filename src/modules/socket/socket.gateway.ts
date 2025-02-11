import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';
import { LoggerUtils } from 'common/utils/logger.utils';
import { jwtDecode } from 'jwt-decode';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['*'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = LoggerUtils.get(SocketGateway.name);

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.info(`Client disconnected: ${client.id}`);
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth.token;

    if (token) {
      try {
        const { userId }: any = jwtDecode(token);
        this.logger.info(`ClientId ${client.id} connected room: userId_${userId}`);
        client.join(`user_room_${userId}`);
      } catch (e) {
        this.logger.info(`Failed to decode access token for client ${client.id}`);
      }
    } else {
      this.logger.info(`Guest connected: ${client.id}`);
    }
  }
}
