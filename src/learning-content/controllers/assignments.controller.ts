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
import { LearningContentService } from '../learning-content.service';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseEnrollmentGuard } from '../guards/course-enrollment.guard';
import { CourseOwnershipGuard } from '../../courses/guards/course-ownership.guard';
import { CourseParam } from '../../common/decorators/course-param.decorator';
import { RequireCourseOwnership } from '../../courses/decorators/require-course-ownership.decorator';

@Controller('courses/:courseId/assignments')
export class AssignmentsController {
  constructor(private readonly contentService: LearningContentService) {}

  @Get()
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  getAssignments(@Param('courseId') courseId: string) {
    return this.contentService.getAssignments(courseId);
  }

  @Get(':assignmentId')
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  getAssignment(
    @Param('courseId') courseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.contentService.getAssignmentById(courseId, assignmentId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  createAssignment(
    @Param('courseId') courseId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.contentService.createAssignment(courseId, dto);
  }

  @Patch(':assignmentId')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
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
  deleteAssignment(
    @Param('courseId') courseId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.contentService.deleteAssignment(courseId, assignmentId);
  }
}
