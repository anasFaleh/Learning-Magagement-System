// enrollment.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  // Enroll a student into a course, with payment and role checks
  async enrollStudent(
    requestorRole: string,
    courseId: string,
    dto: EnrollStudentDto,
  ) {
    // 1. Verify course exists, is active
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { price: true },
    });
    if (!course || !course.isActive)
      throw new NotFoundException('Course not available');

    // 2. Check if student is already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: dto.studentId, courseId } },
    });
    if (existing) throw new BadRequestException('Student already enrolled');

    // 3. Validate student role (must be STUDENT)
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentId },
    });
    if (!student || student.role !== 'STUDENT') {
      throw new BadRequestException('User is not a student');
    }

    // 4. Payment validation
    const isPaidCourse = course.price && course.price.amount > 0;
    let enrolledBy: string;

    if (isPaidCourse) {
      if (dto.paymentId) {
        // Verify payment exists and belongs to this student
        const payment = await this.prisma.payment.findUnique({
          where: { id: dto.paymentId },
        });
        if (
          !payment ||
          payment.userId !== dto.studentId ||
          payment.status !== 'COMPLETED'
        ) {
          throw new BadRequestException('Invalid payment');
        }
        enrolledBy = 'PAYMENT';
      } else if (requestorRole === 'ADMIN') {
        enrolledBy = 'ADMIN';
      } else {
        throw new ForbiddenException('Payment required');
      }
    } else {
      enrolledBy = 'FREE';
    }

    return this.prisma.enrollment.create({
      data: {
        studentId: dto.studentId,
        courseId,
        paymentId: dto.paymentId,
        enrolledBy,
        progress: 0,
      },
      include: {
        student: { select: { id: true, email: true, profile: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  // Unenroll a student
  async unenrollStudent(courseId: string, studentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.enrollment.delete({ where: { id: enrollment.id } });
  }

  // Get all enrollments for a course (teacher/admin)
  async getCourseEnrollments(
    courseId: string,
    query: { page: number; limit: number },
  ) {
    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        include: {
          student: { select: { id: true, email: true, profile: true } },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where: { courseId } }),
    ]);
    return { enrollments, total, page: query.page, limit: query.limit };
  }

  // Get all courses a student is enrolled in (student)
  async getStudentEnrollments(
    studentId: string,
    query: { page: number; limit: number },
  ) {
    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { studentId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              teacher: { select: { id: true, email: true } },
            },
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where: { studentId } }),
    ]);
    return { enrollments, total, page: query.page, limit: query.limit };
  }

  // Update progress (teacher/admin)
  async updateProgress(enrollmentId: string, dto: UpdateProgressDto) {
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress: dto.progress },
    });
  }

  // Access check – used by guards
  async isEnrolledOrOwner(
    userId: string,
    role: string,
    courseId: string,
  ): Promise<boolean> {
    if (role === 'ADMIN') return true;

    // Teacher: must own the course
    if (role === 'TEACHER') {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });
      if (course && course.teacherId === userId) return true;
      return false;
    }

    // Student: must be enrolled
    if (role === 'STUDENT') {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId, courseId } },
      });
      return !!enrollment;
    }

    return false;
  }
}
