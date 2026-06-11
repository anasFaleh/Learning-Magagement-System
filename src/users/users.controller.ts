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
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SelfOrAdmin } from './decorators/self-or-admin.decorator';
import { SelfOrAdminGuard } from './guards/self-or-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT' })
  async getMyProfile(@CurrentUser() user: { userId: string; role: UserRole }) {
    return this.usersService.getMyProfile(user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user details by ID (self or admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot access other users profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('id') id: string,
  ) {
    return this.usersService.getUserById(user, id);
  }

  @Patch(':id/profile')
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @SelfOrAdmin('id')
  @ApiOperation({ summary: 'Update user profile (self or admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cannot update other users profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user, id, dto);
  }

  @Patch(':id/activation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Activate or deactivate user account (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User activation status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can manage user activation' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setActivation(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('id') id: string,
  ) {
    // ✅ Fix: pass requestor userId so service can block self-deactivation
    return this.usersService.setUserActiveStatus(id, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Search and filter users (admin only)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by user role' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can search users' })
  async searchUsers(@Query() query: UserQueryDto) {
    return this.usersService.searchUsers(query);
  }
}
