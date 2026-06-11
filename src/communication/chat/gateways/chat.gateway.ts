import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    // ✅ Dynamic CORS: reads from env. In development allows all origins.
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowed = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : [];
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev || !origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  },
  // ✅ Fastify compatibility: socket.io needs this
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);
      const courseId = client.handshake.query?.courseId as string;

      if (!courseId) {
        client.emit('error', { message: 'courseId is required' });
        client.disconnect();
        return;
      }

      if (!token) {
        client.emit('error', { message: 'Authentication token is required' });
        client.disconnect();
        return;
      }

      let payload: { sub: string; role: string };
      try {
        payload = this.jwtService.verify(token, {
          secret: this.config.get('JWT_SECRET'),
        });
      } catch {
        client.emit('error', { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true, isActive: true, deletedAt: true },
      });

      if (!course || !course.isActive || course.deletedAt) {
        client.emit('error', { message: 'Course not found or inactive' });
        client.disconnect();
        return;
      }

      const isTeacher = course.teacherId === payload.sub;
      const isAdmin = payload.role === 'ADMIN';

      if (!isTeacher && !isAdmin) {
        const enrollment = await this.prisma.enrollment.findUnique({
          where: { studentId_courseId: { studentId: payload.sub, courseId } },
        });
        if (!enrollment) {
          client.emit('error', {
            message: 'You are not enrolled in this course',
          });
          client.disconnect();
          return;
        }
      }

      client.data.user = { id: payload.sub, role: payload.role };
      await client.join(`course_${courseId}`);
      this.logger.log(
        `Client ${client.id} (user: ${payload.sub}) joined course_${courseId}`,
      );
    } catch (error) {
      this.logger.error(
        `Connection error for client ${client.id}:`,
        error instanceof Error ? error.message : String(error),
      );
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
        content: payload.content.trim(),
      });

      // ✅ Broadcast to all in the course room (including sender)
      this.server
        .to(`course_${payload.courseId}`)
        .emit('newMessage', savedMessage);
    } catch (error) {
      this.logger.error(
        `Failed to handle message from client ${client.id}:`,
        error instanceof Error ? error.message : String(error),
      );
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}
