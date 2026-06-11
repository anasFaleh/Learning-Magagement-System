// guards/course-ownership.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_COURSE_OWNERSHIP } from '../decorators/require-course-ownership.decorator';
import { CoursesService } from '../courses.service';

@Injectable()
export class CourseOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private coursesService: CoursesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const paramName = this.reflector.get<string>(
      REQUIRE_COURSE_OWNERSHIP,
      context.getHandler(),
    );
    if (!paramName) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const courseId = request.params[paramName];

    // ✅ Fix: guard against missing courseId in params
    if (!courseId)
      throw new NotFoundException('Course ID missing from request');

    if (user.role === 'ADMIN') return true;

    // ✅ Fix: teachers only — students should not reach ownership-guarded routes
    if (user.role !== 'TEACHER') {
      throw new ForbiddenException(
        'Only teachers and admins can manage courses',
      );
    }

    const course = await this.coursesService.findCourseById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    if (course.teacherId !== user.userId) {
      throw new ForbiddenException('You can only modify your own courses');
    }
    return true;
  }
}
