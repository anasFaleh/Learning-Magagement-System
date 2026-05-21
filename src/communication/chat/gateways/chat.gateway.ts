// chat.gateway.ts
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    // verify JWT token, courseId from query, and membership using CourseEnrollmentGuard logic
    // join the room `course_${courseId}`
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { courseId: string; content: string },
  ) {
    // save message via ChatService, then broadcast to room
    this.server.to(`course_${payload.courseId}`).emit('newMessage', message);
  }
}
