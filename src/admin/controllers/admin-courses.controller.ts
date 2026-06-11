import { Controller, UseGuards, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminService } from '../admin.service';
import { AdminCourseQueryDto } from '../dto/admin-course-query.dto';
import { Cacheable, InvalidatesCache } from '../../common/decorators/cache.decorator';

@ApiTags('Admin - Courses')
@ApiBearerAuth('JWT-auth')
@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCoursesController {
  constructor(private adminService: AdminService) {}

  @Get()
  @Cacheable('admin:courses', 60)
  @ApiOperation({ summary: 'Get all courses (admin only)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Courses retrieved' })
  getCourses(@Query() query: AdminCourseQueryDto) {
    return this.adminService.getCourses(query);
  }

  @Patch(':id/activation')
  @InvalidatesCache(['admin:courses', 'courses', 'admin:stats'])
  @ApiOperation({ summary: 'Toggle course activation status (admin only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course activation status updated' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  setCourseActivation(@Param('id') id: string) {
    return this.adminService.setCourseActiveStatus(id);
  }
}
