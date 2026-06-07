import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() 
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      const courseId = client.handshake.query?.courseId as string;

      if (!courseId) {
        this.logger.warn(`Client ${client.id} disconnected: missing courseId`);
        client.emit('error', { message: 'courseId is required' });
        client.disconnect();
        return;
      }

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: missing token`);
        client.emit('error', { message: 'Authentication token is required' });
        client.disconnect();
        return;
      }

      // TODO: Verify JWT token and course enrollment here
      // const payload = this.jwtService.verify(token);
      // client.data.user = { id: payload.sub, role: payload.role };

      await client.join(`course_${courseId}`);
      this.logger.log(`Client ${client.id} joined room: course_${courseId}`);
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error instanceof Error ? error.message : String(error));
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { courseId: string; content: string },
  ) {
    try {
      // Validate payload
      if (!payload?.courseId || !payload?.content?.trim()) {
        client.emit('error', { message: 'courseId and content are required' });
        return;
      }

      const senderId = client.data?.user?.id;

      if (!senderId) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const savedMessage = await this.chatService.createMessage({
        courseId: payload.courseId,
        senderId,
        content: payload.content,
      });

      this.server.to(`course_${payload.courseId}`).emit('newMessage', savedMessage);
    } catch (error) {
      this.logger.error(
        `Failed to handle message from client ${client.id}:`,
        error instanceof Error ? error.message : String(error),
      );
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}
