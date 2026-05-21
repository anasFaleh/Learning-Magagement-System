import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * دالة مخصصة للـ Gateway تستقبل البيانات مباشرة كـ Object
   */
  async createMessage(data: { courseId: string; senderId: string; content: string }) {
    return this.prisma.message.create({
      data: {
        courseId: data.courseId,
        senderId: data.senderId,
        content: data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * الدالة القديمة الخاصة بالـ Controller تم الحفاظ عليها وتوجيهها للدالة الأساسية
   */
  async sendMessage(courseId: string, senderId: string, dto: SendMessageDto) {
    return this.createMessage({
      courseId,
      senderId,
      content: dto.content,
    });
  }

  async getMessages(courseId: string, query: MessageQueryDto) {
    // حل مشكلة المحاذاة الحسابية والـ undefined الصارمة عبر التايب سكريبت
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 10);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { courseId },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { courseId } }),
    ]);

    return { messages, total, page, limit };
  }
}