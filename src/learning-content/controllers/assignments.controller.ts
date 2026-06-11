import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LearningContentService } from '../learning-content.service';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseEnrollmentGuard } from '../guards/course-enrollment.guard';
import { CourseOwnershipGuard } from '../../courses/guards/course-ownership.guard';
import { CourseParam } from '../../common/decorators/course-param.decorator';
import { RequireCourseOwnership } from '../../courses/decorators/require-course-ownership.decorator';

@ApiTags('Assignments')
@ApiBearerAuth('JWT-auth')
@Controller('courses/:courseId/assignments')
export class AssignmentsController {
  constructor(private readonly contentService: LearningContentService) {}

  @Get()
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  @ApiOperation({ summary: 'Get all assignments in a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Assignments retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not enrolled in course',
  })
  getAssignments(@Param('courseId') courseId: string) {
    return this.contentService.getAssignments(courseId);
  }

  @Get(':assignmentId')
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  @ApiOperation({ summary: 'Get a specific assignment' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment retrieved' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not enrolled in course',
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  getAssignment(
    @Param('courseId') courseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.contentService.getAssignmentById(courseId, assignmentId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Create a new assignment (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid assignment data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not course owner or admin',
  })
  createAssignment(
    @Param('courseId') courseId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.contentService.createAssignment(courseId, dto);
  }

  @Patch(':assignmentId')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Update an assignment (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not course owner or admin',
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  updateAssignment(
    @Param('courseId') courseId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.contentService.updateAssignment(courseId, assignmentId, dto);
  }

  @Delete(':assignmentId')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Delete an assignment (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not course owner or admin',
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  deleteAssignment(
    @Param('courseId') courseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.contentService.deleteAssignment(courseId, assignmentId);
  }
}
