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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
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

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all courses (filtered by role)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by course title' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'teacherId', required: false, description: 'Filter by teacher ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT' })
  listCourses(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query() query: CourseQueryDto,
  ) {
    return this.coursesService.listCourses(user, query);
  }

  @Get('enrolled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get enrolled courses for current student' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Enrolled courses retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only students can access this endpoint' })
  getEnrolledCourses(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.coursesService.getEnrolledCourses(user.userId, { page, limit });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @ApiOperation({ summary: 'Create a new course (teachers/admins only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid course data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only teachers and admins can create courses' })
  createCourse(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.createCourse(user, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get course details by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course details retrieved' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  getCourse(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('id') id: string,
  ) {
    return this.coursesService.getCourseById(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('id')
  @ApiOperation({ summary: 'Update course details (owner/admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the course owner or admin' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.coursesService.updateCourse(id, dto, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('id')
  @ApiOperation({ summary: 'Delete a course (owner/admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the course owner or admin' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('id')
  @ApiOperation({ summary: 'Enroll a student in the course (owner/admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the course owner or admin' })
  @ApiResponse({ status: 409, description: 'Conflict - Student already enrolled' })
  enrollStudent(@Param('id') id: string, @Body() dto: EnrollStudentDto) {
    return this.coursesService.enrollStudent(id, dto);
  }

  @Delete(':id/enroll/:studentId')
  @UseGuards(JwtAuthGuard, CourseOwnershipGuard)
  @RequireCourseOwnership('id')
  @ApiOperation({ summary: 'Unenroll a student from the course (owner/admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student unenrolled successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the course owner or admin' })
  @ApiResponse({ status: 404, description: 'Student not found in course' })
  unenrollStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.coursesService.unenrollStudent(id, studentId);
  }

  @Patch(':id/assign-teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign a teacher to a course (admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Teacher assigned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can assign teachers' })
  @ApiResponse({ status: 404, description: 'Course or teacher not found' })
  assignTeacher(@Param('id') id: string, @Body('teacherId') teacherId: string) {
    return this.coursesService.assignTeacher(id, teacherId);
  }
}
