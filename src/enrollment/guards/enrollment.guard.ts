// guards/enrollment.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EnrollmentService } from '../enrollment.service';
import { COURSE_PARAM_KEY } from '../../common/decorators/course-param.decorator';

@Injectable()
export class EnrollmentGuard implements CanActivate {
  constructor(
    private enrollmentService: EnrollmentService,
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

    const hasAccess = await this.enrollmentService.isEnrolledOrOwner(
      user.userId,
      user.role,
      courseId,
    );
    if (!hasAccess)
      throw new ForbiddenException('Access denied – not enrolled');
    return true;
  }
}
