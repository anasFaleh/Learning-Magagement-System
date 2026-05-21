// courses.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireCourseOwnership } from './decorators/require-course-ownership.decorator';
import { CourseOwnershipGuard } from './guards/course-ownership.guard';
import { UserRole } from '@prisma/client';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Public catalog (any authenticated user) – students see active, teachers own, admin all
  @Get()
  @UseGuards(JwtAuthGuard)
  listCourses(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query() query: CourseQueryDto,
  ) {
    return this.coursesService.listCourses(user, query);
  }

  // Student's enrolled courses
  @Get('enrolled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  getEnrolledCourses(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.coursesService.getEnrolledCourses(user.userId, { page, limit });
  }

  // Create course (teacher/admin)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  createCourse(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.createCourse(user, dto);
  }

  // Get single course (authorized)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getCourse(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('id') id: string,
  ) {
    return this.coursesService.getCourseById(id, user);
  }

  // Update course (owner/admin)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('id')
  updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.coursesService.updateCourse(id, dto, user.role);
  }

  // Delete course (owner/admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('id')
  deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  // Enroll student (owner/admin)
  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('id')
  enrollStudent(@Param('id') id: string, @Body() dto: EnrollStudentDto) {
    return this.coursesService.enrollStudent(id, dto);
  }

  // Unenroll student (owner/admin)
  @Delete(':id/enroll/:studentId')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('id')
  unenrollStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.coursesService.unenrollStudent(id, studentId);
  }

  // Admin: assign teacher
  @Patch(':id/assign-teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  assignTeacher(@Param('id') id: string, @Body('teacherId') teacherId: string) {
    return this.coursesService.assignTeacher(id, teacherId);
  }
}
