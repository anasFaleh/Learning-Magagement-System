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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
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

@ApiTags('Enrollment')
@ApiBearerAuth('JWT-auth')
@Controller()
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post('admin/courses/:courseId/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Enroll student directly (bypass payment)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can enroll' })
  @ApiResponse({ status: 404, description: 'Course or student not found' })
  adminEnroll(
    @Param('courseId') courseId: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.enrollmentService.enrollStudent('ADMIN', courseId, dto);
  }

  @Delete('admin/courses/:courseId/unenroll/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Unenroll student from course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student unenrolled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can unenroll' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  adminUnenroll(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.enrollmentService.unenrollStudent(courseId, studentId);
  }

  @Get('courses/:courseId/enrollments')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Get course enrollments (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Course enrollments retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not course owner or admin' })
  getCourseEnrollments(
    @Param('courseId') courseId: string,
    @Query() query: EnrollmentQueryDto,
  ) {
    return this.enrollmentService.getCourseEnrollments(courseId, {
      page: Number(query?.page ?? 1),
      limit: Number(query?.limit ?? 10),
    } as any);
  }

  // ✅ Fix Bug 2: pass user into service so ownership can be verified
  @Patch('enrollments/:id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update student enrollment progress' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot update others progress' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user,
  ) {
    return this.enrollmentService.updateProgress(id, dto, user.userId, user.role);
  }

  @Get('my-enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get current student enrolled courses' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Student enrollments retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only students can access this' })
  getMyEnrollments(@CurrentUser() user, @Query() query: EnrollmentQueryDto) {
    return this.enrollmentService.getStudentEnrollments(user.userId, {
      page: Number(query?.page ?? 1),
      limit: Number(query?.limit ?? 10),
    } as any);
  }
}
