import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LearningContentService } from '../learning-content.service';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CourseOwnershipGuard } from '../../courses/guards/course-ownership.guard';
import { RequireCourseOwnership } from '../../courses/decorators/require-course-ownership.decorator';
import { UserRole } from '@prisma/client';

@Controller('courses/:courseId/announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(
    private readonly learningContentService: LearningContentService,
  ) {}

  @Get()
  async findAll(@Param('courseId') courseId: string) {
    return this.learningContentService.getAnnouncements(courseId);
  }

  @Post()
  @UseGuards(RolesGuard, CourseOwnershipGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @RequireCourseOwnership('courseId')
  async create(
    @Param('courseId') courseId: string,
    @Body() createDto: CreateAnnouncementDto,
  ) {
    return this.learningContentService.createAnnouncement(courseId, createDto);
  }

  @Patch(':announcementId')
  @UseGuards(RolesGuard, CourseOwnershipGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @RequireCourseOwnership('courseId')
  async update(
    @Param('courseId') courseId: string,
    @Param('announcementId') announcementId: string,
    @Body() updateDto: UpdateAnnouncementDto,
  ) {
    return this.learningContentService.updateAnnouncement(
      courseId,
      announcementId,
      updateDto,
    );
  }

  @Delete(':announcementId')
  @UseGuards(RolesGuard, CourseOwnershipGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @RequireCourseOwnership('courseId')
  async remove(
    @Param('courseId') courseId: string,
    @Param('announcementId') announcementId: string,
  ) {
    return this.learningContentService.deleteAnnouncement(
      courseId,
      announcementId,
    );
  }
}
