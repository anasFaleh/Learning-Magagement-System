// chat.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(courseId: string, senderId: string, dto: SendMessageDto) {
    return this.prisma.message.create({
      data: {
        courseId,
        senderId,
        content: dto.content,
      },
      include: {
        sender: {
          select: { id: true, email: true, profile: true },
        },
      },
    });
  }

  async getMessages(courseId: string, query: MessageQueryDto) {
    const { page, limit } = query;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { courseId },
        include: {
          sender: {
            select: { id: true, email: true, profile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.message.count({ where: { courseId } }),
    ]);

    return { messages, total, page, limit };
  }
}
