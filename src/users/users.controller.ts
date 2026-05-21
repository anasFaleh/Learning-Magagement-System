// users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get current user's own profile
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: { userId: string; role: UserRole }) {
    return this.usersService.getMyProfile(user.userId);
  }

  // Get a user by ID (role‑scoped)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUser(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('id') id: string,
  ) {
    return this.usersService.getUserById(user, id);
  }

  // Update profile – self or admin
  @Patch(':id/profile')
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard)
  @SelfOrAdmin('id') // triggers guard; param name matches route
  async updateProfile(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user, id, dto);
  }

  // Admin: activate/deactivate user
  @Patch(':id/activation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async setActivation(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.setUserActiveStatus(id, isActive);
  }

  // Admin: search users
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async searchUsers(@Query() query: UserQueryDto) {
    return this.usersService.searchUsers(query);
  }
}
