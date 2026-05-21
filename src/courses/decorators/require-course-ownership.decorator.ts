// decorators/require-course-ownership.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_COURSE_OWNERSHIP = 'requireCourseOwnership';
export const RequireCourseOwnership = (paramName: string = 'id') =>
  SetMetadata(REQUIRE_COURSE_OWNERSHIP, paramName);
