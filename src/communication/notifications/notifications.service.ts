// notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from './events/notification-events';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  // Retrieve user notifications
  async getUserNotifications(userId: string, page: number, limit: number) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { notifications, total, page, limit };
  }

  // Mark one or all as read
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // Event listeners – each creates notifications for the relevant users

  @OnEvent(NOTIFICATION_EVENTS.ANNOUNCEMENT_CREATED)
  async handleAnnouncementCreated(payload: {
    courseId: string;
    title: string;
    announcementId: string;
  }) {
    try {
      const userIds = await this.getCourseMemberUserIds(payload.courseId);
      await this.createNotifications(
        userIds,
        'ANNOUNCEMENT',
        `New announcement: ${payload.title}`,
        'A new announcement has been posted.',
        payload.courseId,
        payload.announcementId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create ANNOUNCEMENT notifications for course ${payload.courseId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.ASSIGNMENT_CREATED)
  async handleAssignmentCreated(payload: {
    courseId: string;
    title: string;
    assignmentId: string;
  }) {
    try {
      const userIds = await this.getCourseMemberUserIds(payload.courseId);
      await this.createNotifications(
        userIds,
        'ASSIGNMENT',
        `New assignment: ${payload.title}`,
        'A new assignment has been posted.',
        payload.courseId,
        payload.assignmentId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create ASSIGNMENT notifications for course ${payload.courseId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.CONTENT_CREATED)
  async handleContentCreated(payload: {
    courseId: string;
    title: string;
    entityId: string;
    contentType: string;
  }) {
    try {
      const userIds = await this.getCourseMemberUserIds(payload.courseId);
      await this.createNotifications(
        userIds,
        'CONTENT',
        `New ${payload.contentType}: ${payload.title}`,
        `A new ${payload.contentType} has been added to the course.`,
        payload.courseId,
        payload.entityId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create CONTENT notifications for course ${payload.courseId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.ENROLLMENT_CREATED)
  async handleEnrollmentCreated(payload: {
    courseId: string;
    studentId: string;
  }) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: payload.courseId },
        select: { teacherId: true, title: true },
      });
      if (course) {
        await this.createNotifications(
          [course.teacherId],
          'ENROLLMENT',
          'New student enrolled',
          `A student has enrolled in your course "${course.title}".`,
          payload.courseId,
          payload.studentId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create ENROLLMENT_CREATED notification for course ${payload.courseId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.ENROLLMENT_DELETED)
  async handleEnrollmentDeleted(payload: {
    courseId: string;
    studentId: string;
  }) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: payload.courseId },
        select: { teacherId: true, title: true },
      });
      if (course) {
        await this.createNotifications(
          [course.teacherId],
          'ENROLLMENT',
          'Student unenrolled',
          `A student has left your course "${course.title}".`,
          payload.courseId,
          payload.studentId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create ENROLLMENT_DELETED notification for course ${payload.courseId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // Helpers
  private async getCourseMemberUserIds(courseId: string): Promise<string[]> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        teacherId: true,
        enrollments: { select: { studentId: true } },
      },
    });
    if (!course) return [];
    return [course.teacherId, ...course.enrollments.map((e) => e.studentId)];
  }

  private async createNotifications(
    userIds: string[],
    type: string,
    title: string,
    body: string,
    courseId?: string,
    entityId?: string,
  ) {
    const data = userIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      courseId,
      entityId,
    }));
    if (data.length > 0) {
      await this.prisma.notification.createMany({ data });
    }
  }
}
