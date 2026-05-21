import { Controller, UseGuards, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminService } from '../services/admin.service';

@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCoursesController {
  constructor(private adminService: AdminService) {}

  @Get()
  getCourses(@Query() query: any) {
    return this.adminService.getCourses(query);
  }

  @Patch(':id/activation')
  setCourseActivation(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.setCourseActiveStatus(id, isActive);
  }
}
