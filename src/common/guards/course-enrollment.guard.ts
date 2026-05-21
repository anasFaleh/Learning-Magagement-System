import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CourseEnrollmentGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // القادم من الـ Auth/Jwt Guard
    const courseId = request.params.courseId;

    if (!courseId) {
      // إذا لم يكن هناك courseId في الـ URL، نمرر الطلب أو يمكنك منعه حسب الحاجة
      return true;
    }

    // 1. الأدمن له صلاحية الوصول الكاملة دائماً
    if (user.role === 'ADMIN') {
      return true;
    }

    // التحقق من وجود الكورس أولاً
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('The requested course was not found');
    }

    // 2. إذا كان المستخدم مِدرساً، نتحقق أنه هو صاحب هذا الكورس
    if (user.role === 'TEACHER') {
      if (course.teacherId !== user.userId) {
        throw new ForbiddenException('You are not the assigned teacher for this course');
      }
      return true;
    }

    // 3. إذا كان المستخدم طالباً، نتحقق من وجود قيد نشط له في هذا الكورس
    if (user.role === 'STUDENT') {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: user.userId,
            courseId: courseId,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('You are not enrolled in this course');
      }
      return true;
    }

    return false;
  }
}