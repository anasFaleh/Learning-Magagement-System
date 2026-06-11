// users.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true, profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserById(
    requestor: { userId: string; role: UserRole },
    targetId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, role: true, isActive: true, profile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (requestor.role === UserRole.ADMIN) return user;
    if (requestor.userId === targetId) return user;

    throw new ForbiddenException('Access denied');
  }

  async updateProfile(
    requestor: { userId: string; role: UserRole },
    targetId: string,
    dto: UpdateProfileDto,
  ) {
    if (requestor.role !== UserRole.ADMIN && requestor.userId !== targetId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // ✅ Fix: check user exists before updating
    const existing = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!existing) throw new NotFoundException('User not found');

    // ✅ Fix: if admin changes email, check it's not already taken
    if (requestor.role === UserRole.ADMIN && dto.email && dto.email !== existing.email) {
      const taken = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (taken) throw new ConflictException('Email already in use');
    }

    const profileUpdate: any = {};
    if (dto.firstName !== undefined) profileUpdate.firstName = dto.firstName;
    if (dto.lastName !== undefined) profileUpdate.lastName = dto.lastName;
    if (dto.avatarUrl !== undefined) profileUpdate.avatarUrl = dto.avatarUrl;

    const updateData: any = {};
    if (Object.keys(profileUpdate).length > 0) {
      updateData.profile = { update: profileUpdate };
    }
    if (requestor.role === UserRole.ADMIN && dto.email) {
      updateData.email = dto.email;
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: { id: true, email: true, role: true, isActive: true, profile: true },
    });
  }

  async setUserActiveStatus(userId: string, requestorId?: string) {
    if (requestorId && requestorId === userId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // ✅ Fix: prevent admin from deactivating themselves
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });
  }

  async searchUsers(query: UserQueryDto) {
    const { search, role, isActive, page = 1, limit = 20 } = query;

    // ✅ Fix: clamp limit to prevent abuse
    const safeLimit = Math.min(Number(limit), 100);
    const safePage = Math.max(Number(page), 1);

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
        select: { id: true, email: true, role: true, isActive: true, profile: true },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page: safePage, limit: safeLimit };
  }

  async getActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true },
    });
    if (!user || !user.isActive) throw new NotFoundException('User not found or inactive');
    return user;
  }
}
