import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateEnrollmentRequestDto } from './dto/create-enrollment-request.dto';
import { ReviewEnrollmentRequestDto, ReviewAction } from './dto/review-enrollment-request.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EnrollmentRequestStatus } from '@prisma/client';

@Injectable()
export class EnrollmentService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────
  // ENROLLMENT REQUESTS
  // ─────────────────────────────────────────────

  async requestEnrollment(studentId: string, dto: CreateEnrollmentRequestDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { id: true, title: true, isActive: true, teacherId: true, deletedAt: true },
    });

    if (!course || !course.isActive || course.deletedAt) {
      throw new NotFoundException('Course not available');
    }

    // Already enrolled?
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId: dto.courseId } },
    });
    if (enrolled) {
      throw new ConflictException('You are already enrolled in this course');
    }

    // Existing pending/approved request?
    const existing = await this.prisma.enrollmentRequest.findUnique({
      where: { studentId_courseId: { studentId, courseId: dto.courseId } },
    });
    if (existing) {
      if (existing.status === EnrollmentRequestStatus.PENDING) {
        throw new ConflictException('You already have a pending request for this course');
      }
      if (existing.status === EnrollmentRequestStatus.APPROVED) {
        throw new ConflictException('Your request was already approved');
      }
      // REJECTED → allow re-apply by updating
      return this.prisma.enrollmentRequest.update({
        where: { id: existing.id },
        data: {
          status: EnrollmentRequestStatus.PENDING,
          message: dto.message ?? null,
          note: null,
          updatedAt: new Date(),
        },
      });
    }

    const request = await this.prisma.enrollmentRequest.create({
      data: {
        studentId,
        courseId: dto.courseId,
        message: dto.message ?? null,
        status: EnrollmentRequestStatus.PENDING,
      },
      include: {
        student: { select: { id: true, email: true, profile: true } },
        course: { select: { id: true, title: true } },
      },
    });

    // Notify teacher
    this.eventEmitter.emit('enrollment.requested', {
      teacherId: course.teacherId,
      studentId,
      courseId: dto.courseId,
      courseTitle: course.title,
      requestId: request.id,
    });

    return request;
  }

  async reviewRequest(
    requestId: string,
    reviewerId: string,
    reviewerRole: string,
    dto: ReviewEnrollmentRequestDto,
  ) {
    const request = await this.prisma.enrollmentRequest.findUnique({
      where: { id: requestId },
      include: {
        course: { select: { id: true, title: true, teacherId: true } },
        student: { select: { id: true, email: true } },
      },
    });

    if (!request) throw new NotFoundException('Request not found');

    // Only course teacher or admin can review
    const isTeacher = request.course.teacherId === reviewerId;
    const isAdmin = reviewerRole === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      throw new ForbiddenException('Only the course teacher or admin can review requests');
    }

    if (request.status !== EnrollmentRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been reviewed');
    }

    if (dto.action === ReviewAction.APPROVE) {
      // Create enrollment and update request atomically
      const [, enrollment] = await this.prisma.$transaction([
        this.prisma.enrollmentRequest.update({
          where: { id: requestId },
          data: {
            status: EnrollmentRequestStatus.APPROVED,
            note: dto.note ?? null,
          },
        }),
        this.prisma.enrollment.create({
          data: {
            studentId: request.studentId,
            courseId: request.courseId,
            enrolledBy: isAdmin ? 'ADMIN' : 'REQUEST',
            progress: 0,
          },
          include: {
            student: { select: { id: true, email: true, profile: true } },
            course: { select: { id: true, title: true } },
          },
        }),
      ]);

      // Notify student
      this.eventEmitter.emit('enrollment.approved', {
        studentId: request.studentId,
        courseId: request.courseId,
        courseTitle: request.course.title,
      });

      return { message: 'Request approved and student enrolled', enrollment };
    } else {
      // REJECT
      const updated = await this.prisma.enrollmentRequest.update({
        where: { id: requestId },
        data: {
          status: EnrollmentRequestStatus.REJECTED,
          note: dto.note ?? null,
        },
      });

      // Notify student
      this.eventEmitter.emit('enrollment.rejected', {
        studentId: request.studentId,
        courseId: request.courseId,
        courseTitle: request.course.title,
        note: dto.note,
      });

      return { message: 'Request rejected', request: updated };
    }
  }

  async getCourseRequests(
    courseId: string,
    reviewerId: string,
    reviewerRole: string,
    status?: EnrollmentRequestStatus,
  ) {
    // Verify access
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const isTeacher = course.teacherId === reviewerId;
    const isAdmin = reviewerRole === 'ADMIN';
    if (!isTeacher && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.enrollmentRequest.findMany({
      where: {
        courseId,
        ...(status ? { status } : {}),
      },
      include: {
        student: { select: { id: true, email: true, profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyRequests(studentId: string) {
    return this.prisma.enrollmentRequest.findMany({
      where: { studentId },
      include: {
        course: { select: { id: true, title: true, teacher: { select: { id: true, email: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async cancelRequest(requestId: string, studentId: string) {
    const request = await this.prisma.enrollmentRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.studentId !== studentId) throw new ForbiddenException('Not your request');
    if (request.status !== EnrollmentRequestStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending requests');
    }
    return this.prisma.enrollmentRequest.delete({ where: { id: requestId } });
  }

  // ─────────────────────────────────────────────
  // DIRECT ENROLLMENT (Admin only)
  // ─────────────────────────────────────────────

  async adminEnrollStudent(courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isActive: true, deletedAt: true },
    });
    if (!course || !course.isActive || course.deletedAt) {
      throw new NotFoundException('Course not available');
    }

    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'STUDENT') {
      throw new BadRequestException('User is not a student');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) throw new ConflictException('Student already enrolled');

    return this.prisma.enrollment.create({
      data: { studentId, courseId, enrolledBy: 'ADMIN', progress: 0 },
      include: {
        student: { select: { id: true, email: true, profile: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async unenrollStudent(courseId: string, studentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return this.prisma.enrollment.delete({ where: { id: enrollment.id } });
  }

  // ─────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────

  async getCourseEnrollments(courseId: string, query: { page: number; limit: number }) {
    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        include: { student: { select: { id: true, email: true, profile: true } } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where: { courseId } }),
    ]);
    return { enrollments, total, page: query.page, limit: query.limit };
  }

  async getStudentEnrollments(studentId: string, query: { page: number; limit: number }) {
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

  async updateProgress(
    enrollmentId: string,
    dto: UpdateProgressDto,
    requestorId: string,
    requestorRole: string,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: { select: { teacherId: true } } },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const isOwner = enrollment.studentId === requestorId;
    const isCourseTeacher = enrollment.course.teacherId === requestorId;
    const isAdmin = requestorRole === 'ADMIN';

    if (!isOwner && !isCourseTeacher && !isAdmin) {
      throw new ForbiddenException('You cannot update this enrollment progress');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress: dto.progress },
    });
  }

  async isEnrolledOrOwner(userId: string, role: string, courseId: string): Promise<boolean> {
    if (role === 'ADMIN') return true;

    if (role === 'TEACHER') {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });
      return !!(course && course.teacherId === userId);
    }

    if (role === 'STUDENT') {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId, courseId } },
      });
      return !!enrollment;
    }

    return false;
  }
}
