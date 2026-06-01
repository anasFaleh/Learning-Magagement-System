import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LearningContentService } from '../learning-content.service';
import { SubmitAssignmentDto } from '../dto/submit-assignment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseEnrollmentGuard } from '../guards/course-enrollment.guard';
import { CourseParam } from '../../common/decorators/course-param.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CourseOwnershipGuard } from '../../courses/guards/course-ownership.guard';
import { RequireCourseOwnership } from '../../courses/decorators/require-course-ownership.decorator';

@ApiTags('Submissions')
@ApiBearerAuth('JWT-auth')
@Controller('courses/:courseId/assignments/:assignmentId')
export class SubmissionsController {
  constructor(private readonly contentService: LearningContentService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  @ApiOperation({ summary: 'Submit assignment (students only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({ status: 201, description: 'Assignment submitted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only students can submit' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  submit(
    @Param('courseId') courseId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitAssignmentDto,
  ) {
    if (user.role !== 'STUDENT')
      throw new ForbiddenException('Only students can submit assignments');
    return this.contentService.submitAssignment(
      courseId,
      assignmentId,
      user.userId,
      dto,
    );
  }

  @Get('submissions')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Get all submissions for assignment (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Submissions retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not course owner or admin' })
  getSubmissions(
    @Param('courseId') courseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.contentService.getSubmissions(courseId, assignmentId);
  }

  @Get('my-submission')
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  @ApiOperation({ summary: 'Get current student submission' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Student submission retrieved' })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  getMySubmission(
    @Param('courseId') courseId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.contentService.getStudentSubmission(
      courseId,
      assignmentId,
      user.userId,
    );
  }
}
