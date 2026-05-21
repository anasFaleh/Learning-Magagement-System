// decorators/course-param.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const COURSE_PARAM_KEY = 'courseParam';
export const CourseParam = (paramName: string = 'courseId') =>
  SetMetadata(COURSE_PARAM_KEY, paramName);
