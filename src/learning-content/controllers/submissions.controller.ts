import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { LearningContentService } from '../learning-content.service';
import { SubmitAssignmentDto } from '../dto/submit-assignment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseEnrollmentGuard } from '../guards/course-enrollment.guard';
import { CourseParam } from '../../common/decorators/course-param.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CourseOwnershipGuard } from '../../courses/guards/course-ownership.guard';
import { RequireCourseOwnership } from '../../courses/decorators/require-course-ownership.decorator';

@Controller('courses/:courseId/assignments/:assignmentId')
export class SubmissionsController {
  constructor(private readonly contentService: LearningContentService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
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
  getSubmissions(
    @Param('courseId') courseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.contentService.getSubmissions(courseId, assignmentId);
  }

  @Get('my-submission')
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
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
