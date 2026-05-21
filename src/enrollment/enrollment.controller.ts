// enrollment.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CourseOwnershipGuard } from '../courses/guards/course-ownership.guard';
import { RequireCourseOwnership } from '../courses/decorators/require-course-ownership.decorator';

@Controller()
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // Admin: enroll a student into a course (bypass payment if needed)
  @Post('admin/courses/:courseId/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminEnroll(
    @Param('courseId') courseId: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.enrollmentService.enrollStudent('ADMIN', courseId, dto);
  }

  // Admin: unenroll
  @Delete('admin/courses/:courseId/unenroll/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminUnenroll(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.enrollmentService.unenrollStudent(courseId, studentId);
  }

  // Teacher/Admin: list course enrollments
  @Get('courses/:courseId/enrollments')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard) // teacher own course or admin
  @RequireCourseOwnership('courseId')
  getCourseEnrollments(
    @Param('courseId') courseId: string,
    @Query() query: EnrollmentQueryDto,
  ) {
    return this.enrollmentService.getCourseEnrollments(courseId, {
      page: Number(query?.page ?? 1),
      limit: Number(query?.limit ?? 10),
    } as any);
  }

  // Teacher/Admin: update student progress
  @Patch('enrollments/:id/progress')
  @UseGuards(JwtAuthGuard) // further ownership check inside
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user,
  ) {
    // In production, verify the enrollment's course is owned by this teacher/admin
    return this.enrollmentService.updateProgress(id, dto);
  }

  // Student: list own enrollments
  @Get('my-enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  getMyEnrollments(@CurrentUser() user, @Query() query: EnrollmentQueryDto) {
    return this.enrollmentService.getStudentEnrollments(user.userId, {
      page: Number(query?.page ?? 1),
      limit: Number(query?.limit ?? 10),
    } as any);
  }
}
