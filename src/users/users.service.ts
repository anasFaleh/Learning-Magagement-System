// users.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Get the current user's own profile (any role)
  async getMyProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        profile: true,
      },
    });
  }

  // Get a user by ID – role‑scoped
  async getUserById(
    requestor: { userId: string; role: UserRole },
    targetId: string,
  ) {
    // Admin can see anyone
    if (requestor.role === UserRole.ADMIN) {
      return this.prisma.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          profile: true,
        },
      });
    }

    // Non‑admins can only see their own profile
    if (requestor.userId === targetId) {
      return this.prisma.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          profile: true,
        },
      });
    }

    // Teachers viewing students in their courses is intentionally NOT done here.
    // That cross‑module query belongs to the Course service.
    throw new ForbiddenException('Access denied');
  }

  // Update profile – only own profile or admin override
  async updateProfile(
    requestor: { userId: string; role: UserRole },
    targetId: string,
    dto: UpdateProfileDto,
  ) {
    // Only admin or the profile owner can update
    if (requestor.role !== UserRole.ADMIN && requestor.userId !== targetId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Non‑admins cannot change role or activation status
    const updateData: any = { profile: { update: {} } };
    if (dto.firstName !== undefined)
      updateData.profile.update.firstName = dto.firstName;
    if (dto.lastName !== undefined)
      updateData.profile.update.lastName = dto.lastName;
    if (dto.avatarUrl !== undefined)
      updateData.profile.update.avatarUrl = dto.avatarUrl;

    // Admins may also update email (but credentials remain in Auth module)
    if (requestor.role === UserRole.ADMIN && dto.email) {
      updateData.email = dto.email;
    }

    const user = await this.prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        profile: true,
      },
    });
    return user;
  }

  // Admin: toggle user active status
  async setUserActiveStatus(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
  }

  // Admin: search users with pagination
  async searchUsers(query: UserQueryDto) {
    const { search, role, isActive, page = 1, limit = 20 } = query;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          profile: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  // Helper: check if user exists and is active (used by other modules)
  async getActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true },
    });
    if (!user || !user.isActive)
      throw new NotFoundException('User not found or inactive');
    return user;
  }
}
