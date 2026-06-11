import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSystemStats(_query: any) {
    const [userCount, courseCount, enrollmentCount, pendingRequestCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.course.count(),
      this.prisma.enrollment.count(),
      this.prisma.enrollmentRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      users: userCount,
      courses: courseCount,
      enrollments: enrollmentCount,
      pendingEnrollmentRequests: pendingRequestCount,
      timestamp: new Date().toISOString(),
    };
  }

  async getUsers(query: any) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const search = query.search || '';
    const role = query.role || null;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { is: { firstName: { contains: search, mode: 'insensitive' } } } },
        { profile: { is: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async setUserActiveStatus(adminId: string, userId: string) {
    if (adminId === userId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getCourses(query: any) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const search = query.search || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          isActive: true,
          createdAt: true,
          teacher: {
            select: {
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { data: courses, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async setCourseActiveStatus(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.course.update({
      where: { id: courseId },
      data: { isActive: !course.isActive },
      select: { id: true, title: true, description: true, isActive: true, createdAt: true },
    });
  }
}
