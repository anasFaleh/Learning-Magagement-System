// controllers/lectures.controller.ts
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
import { CreateLectureDto, UpdateLectureDto } from '../dto/lecture.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseOwnershipGuard } from '../../courses/guards/course-ownership.guard';
import { CourseEnrollmentGuard } from '../guards/course-enrollment.guard';
import { CourseParam } from '../../common/decorators/course-param.decorator';
import { RequireCourseOwnership } from '../../courses/decorators/require-course-ownership.decorator';

@Controller('courses/:courseId/lectures')
export class LecturesController {
  constructor(private readonly contentService: LearningContentService) {}

  @Get()
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  getLectures(@Param('courseId') courseId: string) {
    return this.contentService.getLectures(courseId);
  }

  @Get(':lectureId')
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  getLecture(
    @Param('courseId') courseId: string,
    @Param('lectureId') lectureId: string,
  ) {
    return this.contentService.getLectureById(courseId, lectureId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard) // teacher/admin only
  @RequireCourseOwnership('courseId')
  createLecture(
    @Param('courseId') courseId: string,
    @Body() dto: CreateLectureDto,
  ) {
    return this.contentService.createLecture(courseId, dto);
  }

  @Patch(':lectureId')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('courseId')
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
  deleteLecture(
    @Param('courseId') courseId: string,
    @Param('lectureId') lectureId: string,
  ) {
    return this.contentService.deleteLecture(courseId, lectureId);
  }
}
