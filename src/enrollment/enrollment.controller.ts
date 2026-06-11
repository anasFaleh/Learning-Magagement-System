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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { CreateEnrollmentRequestDto } from './dto/create-enrollment-request.dto';
import { ReviewEnrollmentRequestDto } from './dto/review-enrollment-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CourseOwnershipGuard } from '../courses/guards/course-ownership.guard';
import { RequireCourseOwnership } from '../courses/decorators/require-course-ownership.decorator';
import { EnrollStudentDto } from './dto/enroll-student.dto';

@ApiTags('Enrollment')
@ApiBearerAuth('JWT-auth')
@Controller()
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // ─────── STUDENT: Request to join ───────

  @Post('enrollment-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Student: Request to enroll in a course' })
  @ApiResponse({ status: 201, description: 'Enrollment request submitted' })
  @ApiResponse({ status: 409, description: 'Conflict - already enrolled or pending request' })
  requestEnrollment(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateEnrollmentRequestDto,
  ) {
    return this.enrollmentService.requestEnrollment(user.userId, dto);
  }

  @Get('enrollment-requests/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Student: Get my enrollment requests' })
  @ApiResponse({ status: 200, description: 'List of student enrollment requests' })
  getMyRequests(@CurrentUser() user: { userId: string }) {
    return this.enrollmentService.getMyRequests(user.userId);
  }

  @Delete('enrollment-requests/:requestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Student: Cancel a pending enrollment request' })
  @ApiParam({ name: 'requestId', description: 'Enrollment Request ID' })
  @ApiResponse({ status: 200, description: 'Request cancelled' })
  cancelRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.enrollmentService.cancelRequest(requestId, user.userId);
  }

  // ─────── TEACHER / ADMIN: Review requests ───────

  @Get('courses/:courseId/enrollment-requests')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Teacher/Admin: Get all enrollment requests for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @ApiResponse({ status: 200, description: 'List of enrollment requests' })
  getCourseRequests(
    @Param('courseId') courseId: string,
    @Query('status') status: any,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.enrollmentService.getCourseRequests(courseId, user.userId, user.role, status);
  }

  @Patch('enrollment-requests/:requestId/review')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Teacher/Admin: Approve or reject an enrollment request' })
  @ApiParam({ name: 'requestId', description: 'Enrollment Request ID' })
  @ApiResponse({ status: 200, description: 'Request reviewed' })
  reviewRequest(
    @Param('requestId') requestId: string,
    @Body() dto: ReviewEnrollmentRequestDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.enrollmentService.reviewRequest(requestId, user.userId, user.role, dto);
  }

  // ─────── ADMIN: Direct enrollment ───────

  @Post('admin/courses/:courseId/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Directly enroll a student (bypass request flow)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  adminEnroll(
    @Param('courseId') courseId: string,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.enrollmentService.adminEnrollStudent(courseId, dto.studentId);
  }

  @Delete('admin/courses/:courseId/unenroll/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Unenroll student from course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student unenrolled successfully' })
  adminUnenroll(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.enrollmentService.unenrollStudent(courseId, studentId);
  }

  // ─────── SHARED ───────

  @Get('courses/:courseId/enrollments')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Get course enrollments (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Course enrollments retrieved' })
  getCourseEnrollments(
    @Param('courseId') courseId: string,
    @Query() query: EnrollmentQueryDto,
  ) {
    return this.enrollmentService.getCourseEnrollments(courseId, {
      page: Number(query?.page ?? 1),
      limit: Number(query?.limit ?? 10),
    } as any);
  }

  @Patch('enrollments/:id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update student enrollment progress' })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.enrollmentService.updateProgress(id, dto, user.userId, user.role);
  }

  @Get('my-enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get current student enrolled courses' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Student enrollments retrieved' })
  getMyEnrollments(@CurrentUser() user: { userId: string }, @Query() query: EnrollmentQueryDto) {
    return this.enrollmentService.getStudentEnrollments(user.userId, {
      page: Number(query?.page ?? 1),
      limit: Number(query?.limit ?? 10),
    } as any);
  }
}
