// courses.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { EnrollStudentDto } from '../enrollment/dto/enroll-student.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  // Create a course (Teacher or Admin)
  async createCourse(
    requestor: { userId: string; role: UserRole },
    dto: CreateCourseDto,
  ) {
    const courseWithSameTitle = await this.prisma.course.findUnique({
      where: { title: dto.title },
    });
    
    if (courseWithSameTitle) {
      throw new ConflictException('Course title must be unique');
    }

    let teacherId = dto.teacherId;

    if (requestor.role === UserRole.ADMIN) {
      if (!teacherId)
        throw new BadRequestException('teacherId is required for admin');
    } else if (requestor.role === UserRole.TEACHER) {
      if (teacherId && teacherId !== requestor.userId) {
        throw new ForbiddenException(
          'You can only create courses for yourself',
        );
      }
      teacherId = requestor.userId;
    } else {
      throw new ForbiddenException(
        'Only teachers and admins can create courses',
      );
    }

    // Verify teacher exists and has TEACHER role
    const teacher = await this.usersService.getActiveUser(teacherId);
    if (teacher.role !== UserRole.TEACHER) {
      throw new BadRequestException('User is not a teacher');
    }

    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        teacherId: teacherId,
      },
      include: {
        teacher: {
          select: { id: true, email: true, profile: true },
        },
      },
    });
  }

  // Update a course (owner or admin) – service assumes ownership already checked by guard
  async updateCourse(courseId: string, dto: UpdateCourseDto, role: UserRole) {
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isActive !== undefined) {
      if (role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'Only admins can change course activation status',
        );
      }
      data.isActive = dto.isActive;
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data,
      include: {
        teacher: { select: { id: true, email: true, profile: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  // Delete a course (owner or admin)
  async deleteCourse(courseId: string) {
    return this.prisma.course.delete({ where: { id: courseId } });
  }

  // Get a single course with authorization
  async getCourseById(
    courseId: string,
    requestor: { userId: string; role: UserRole },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: { select: { id: true, email: true, profile: true } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    // Admin sees all
    if (requestor.role === UserRole.ADMIN) return course;

    // Teacher sees only own courses
    if (
      requestor.role === UserRole.TEACHER &&
      course.teacherId === requestor.userId
    ) {
      return course;
    }

    // Student sees only if enrolled
    if (requestor.role === UserRole.STUDENT) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          studentId_courseId: { studentId: requestor.userId, courseId },
        },
      });
      if (enrollment) return course;
    }

    throw new ForbiddenException('Access denied');
  }

  // List courses – role‑scoped
  async listCourses(
    requestor: { userId: string; role: UserRole },
    query: CourseQueryDto,
  ) {
    const where: any = {};

    // Role‑based filtering
    if (requestor.role === UserRole.TEACHER) {
      where.teacherId = requestor.userId;
    } else if (requestor.role === UserRole.STUDENT) {
      // Students see only active courses (public catalog)
      where.isActive = true;
    }
    // Admin sees everything; filters can override

    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // تأمين قيم الـ Pagination لمنع أخطاء Strict Null Checks (TS18048)
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 10);
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          teacher: { select: { id: true, email: true, profile: true } },
          _count: { select: { enrollments: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { courses, total, page, limit };
  }
  
  // Get courses the current student is enrolled in (student‑only)
  async getEnrolledCourses(
    userId: string,
    query: { page: number; limit: number },
  ) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId: userId },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, email: true, profile: true } },
          },
        },
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });
    return enrollments.map((e) => e.course);
  }

  // Enroll a student (course owner or admin)
  async enrollStudent(courseId: string, dto: EnrollStudentDto) {
    // Verify student exists and is a student
    const student = await this.usersService.getActiveUser(dto.studentId);
    if (student.role !== UserRole.STUDENT) {
      throw new BadRequestException('User is not a student');
    }

    // Prevent duplicate enrollment
    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: dto.studentId, courseId } },
    });
    if (existing) throw new BadRequestException('Student already enrolled');

    return this.prisma.enrollment.create({
      data: { studentId: dto.studentId, courseId },
    });
  }

  // Unenroll a student (course owner or admin)
  async unenrollStudent(courseId: string, studentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.enrollment.delete({ where: { id: enrollment.id } });
  }

  // Admin: assign/change teacher
  async assignTeacher(courseId: string, newTeacherId: string) {
    const teacher = await this.usersService.getActiveUser(newTeacherId);
    if (teacher.role !== UserRole.TEACHER) {
      throw new BadRequestException('User is not a teacher');
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: { teacherId: newTeacherId },
    });
  }

  // Helper for ownership guard – lightweight course fetch
  async findCourseById(courseId: string) {
    return this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacherId: true },
    });
  }
}
