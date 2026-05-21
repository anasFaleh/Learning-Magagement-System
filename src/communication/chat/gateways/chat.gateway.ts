import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() 
  server: Server;

  // حقن الـ ChatService لحفظ الرسائل في قاعدة البيانات
  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      // استخراج الـ token والـ courseId من الـ handshake query القادم من العميل
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      const courseId = client.handshake.query?.courseId as string;

      if (!courseId) {
        client.disconnect();
        return;
      }

      // TODO: قم بوضع منطق التحقق من الـ JWT و الـ CourseEnrollmentGuard هنا باستخدام الـ token المستخرج
      
      // إذا نجح التحقق، يتم إدخال العميل إلى غرفة الكورس المحددة
      await client.join(`course_${courseId}`);
      console.log(`Client ${client.id} joined room: course_${courseId}`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { courseId: string; content: string },
  ) {
    // جلب معرف المستخدم السيرسل من الـ socket (يفضل تخزينه في الـ client أثناء الـ connection بعد فك الـ JWT)
    const senderId = client.data?.user?.id || 'anonymous_user_id'; 

    // 1. حفظ الرسالة في قاعدة البيانات عبر الـ ChatService
    const savedMessage = await this.chatService.createMessage({
      courseId: payload.courseId,
      senderId: senderId,
      content: payload.content,
    });

    // 2. بث الرسالة المحفوظة حديثاً إلى جميع المتواجدين في غرفة هذا الكورس المحددة
    this.server.to(`course_${payload.courseId}`).emit('newMessage', savedMessage);
  }
}