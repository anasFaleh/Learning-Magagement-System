import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { COURSE_PARAM_KEY } from '../../common/decorators/course-param.decorator';

@Injectable()
export class CourseEnrollmentGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const paramName =
      this.reflector.get<string>(COURSE_PARAM_KEY, context.getHandler()) ||
      'courseId';
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const courseId = request.params[paramName];

    if (!courseId) throw new NotFoundException('Course ID missing');

    if (user.role === 'ADMIN') return true;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    // Teacher: must own course
    if (user.role === 'TEACHER') {
      if (course.teacherId === user.userId) return true;
      throw new ForbiddenException('Access denied');
    }

    // Student: must be enrolled
    if (user.role === 'STUDENT') {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          studentId_courseId: { studentId: user.userId, courseId },
        },
      });
      if (!enrollment)
        throw new ForbiddenException('You are not enrolled in this course');
      return true;
    }

    throw new ForbiddenException('Access denied');
  }
}
