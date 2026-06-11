// chat.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: {
    courseId: string;
    senderId: string;
    content: string;
  }) {
    // ✅ Fix: verify sender is enrolled or owns the course before saving
    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId },
      select: { teacherId: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const isTeacher = course.teacherId === data.senderId;
    if (!isTeacher) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: data.senderId,
            courseId: data.courseId,
          },
        },
      });
      if (!enrollment)
        throw new ForbiddenException('You are not a member of this course');
    }

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
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async sendMessage(courseId: string, senderId: string, dto: SendMessageDto) {
    return this.createMessage({ courseId, senderId, content: dto.content });
  }

  async getMessages(courseId: string, query: MessageQueryDto) {
    // ✅ Fix: clamp limit to prevent abuse
    const page = Math.max(Number(query?.page ?? 1), 1);
    const limit = Math.min(Number(query?.limit ?? 20), 100);
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
                select: { firstName: true, lastName: true, avatarUrl: true },
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
