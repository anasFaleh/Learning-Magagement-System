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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LearningContentService } from '../learning-content.service';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CourseOwnershipGuard } from '../../courses/guards/course-ownership.guard';
import { RequireCourseOwnership } from '../../courses/decorators/require-course-ownership.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Announcements')
@ApiBearerAuth('JWT-auth')
@Controller('courses/:courseId/announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(
    private readonly learningContentService: LearningContentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all announcements in a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Announcements retrieved' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findAll(@Param('courseId') courseId: string) {
    return this.learningContentService.getAnnouncements(courseId);
  }

  @Post()
  @UseGuards(RolesGuard, CourseOwnershipGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @RequireCourseOwnership('courseId')
  @ApiOperation({ summary: 'Create a new announcement (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not course owner or admin' })
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
  @ApiOperation({ summary: 'Update an announcement (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'announcementId', description: 'Announcement ID' })
  @ApiResponse({ status: 200, description: 'Announcement updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not course owner or admin' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
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
  @ApiOperation({ summary: 'Delete an announcement (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'announcementId', description: 'Announcement ID' })
  @ApiResponse({ status: 200, description: 'Announcement deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not course owner or admin' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
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
