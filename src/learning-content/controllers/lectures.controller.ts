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
import { CreateLectureDto } from '../dto/create-lecture.dto';
import { UpdateLectureDto } from '../dto/update-lecture.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseOwnershipGuard } from '../../courses/guards/course-ownership.guard';
import { CourseEnrollmentGuard } from '../guards/course-enrollment.guard';
import { CourseParam } from '../../common/decorators/course-param.decorator';
import { RequireCourseOwnership } from '../../courses/decorators/require-course-ownership.decorator';

@ApiTags('Lectures')
@ApiBearerAuth('JWT-auth')
@Controller('courses/:courseId/lectures')
export class LecturesController {
  constructor(private readonly contentService: LearningContentService) {}

  @Get()
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  @ApiOperation({ summary: 'Get all lectures in a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Lectures retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not enrolled in course',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  getLectures(@Param('courseId') courseId: string) {
    return this.contentService.getLectures(courseId);
  }

  @Get(':lectureId')
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  @ApiOperation({ summary: 'Get a specific lecture' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'lectureId', description: 'Lecture ID' })
  @ApiResponse({ status: 200, description: 'Lecture retrieved' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not enrolled in course',
  })
  @ApiResponse({ status: 404, description: 'Lecture not found' })
  getLecture(
    @Param('courseId') courseId: string,
    @Param('lectureId') lectureId: string,
  ) {
    return this.contentService.getLectureById(courseId, lectureId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Create a new lecture (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Lecture created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid lecture data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not course owner or admin',
  })
  createLecture(
    @Param('courseId') courseId: string,
    @Body() dto: CreateLectureDto,
  ) {
    return this.contentService.createLecture(courseId, dto);
  }

  @Patch(':lectureId')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Update a lecture (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'lectureId', description: 'Lecture ID' })
  @ApiResponse({ status: 200, description: 'Lecture updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not course owner or admin',
  })
  @ApiResponse({ status: 404, description: 'Lecture not found' })
  updateLecture(
    @Param('courseId') courseId: string,
    @Param('lectureId') lectureId: string,
    @Body() dto: UpdateLectureDto,
  ) {
    return this.contentService.updateLecture(courseId, lectureId, dto);
  }

  @Delete(':lectureId')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Delete a lecture (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'lectureId', description: 'Lecture ID' })
  @ApiResponse({ status: 200, description: 'Lecture deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not course owner or admin',
  })
  @ApiResponse({ status: 404, description: 'Lecture not found' })
  deleteLecture(
    @Param('courseId') courseId: string,
    @Param('lectureId') lectureId: string,
  ) {
    return this.contentService.deleteLecture(courseId, lectureId);
  }
}
