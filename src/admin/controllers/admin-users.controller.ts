import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminUserQueryDto } from '../dto/admin-user-query.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by user role' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Patch(':id/activation')
  @ApiOperation({ summary: 'Set user activation status (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User activation status updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  setActivation(@Param('id') id: string) {
    return this.adminService.setUserActiveStatus(id);
  }
}
