import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('enrollment.requested')
  async handleEnrollmentRequested(payload: {
    teacherId: string;
    studentId: string;
    courseId: string;
    courseTitle: string;
    requestId: string;
  }) {
    this.logger.debug(`Enrollment requested: ${JSON.stringify(payload)}`);
    await this.notificationsService.createNotification({
      userId: payload.teacherId,
      type: 'ENROLLMENT_REQUEST',
      title: 'New Enrollment Request',
      body: `A student has requested to enroll in "${payload.courseTitle}"`,
      courseId: payload.courseId,
      entityId: payload.requestId,
    });
  }

  @OnEvent('enrollment.approved')
  async handleEnrollmentApproved(payload: {
    studentId: string;
    courseId: string;
    courseTitle: string;
  }) {
    this.logger.debug(`Enrollment approved: ${JSON.stringify(payload)}`);
    await this.notificationsService.createNotification({
      userId: payload.studentId,
      type: 'ENROLLMENT_APPROVED',
      title: 'Enrollment Approved!',
      body: `Your enrollment request for "${payload.courseTitle}" has been approved`,
      courseId: payload.courseId,
    });
  }

  @OnEvent('enrollment.rejected')
  async handleEnrollmentRejected(payload: {
    studentId: string;
    courseId: string;
    courseTitle: string;
    note?: string;
  }) {
    this.logger.debug(`Enrollment rejected: ${JSON.stringify(payload)}`);
    await this.notificationsService.createNotification({
      userId: payload.studentId,
      type: 'ENROLLMENT_REJECTED',
      title: 'Enrollment Request Declined',
      body: payload.note
        ? `Your request for "${payload.courseTitle}" was declined: ${payload.note}`
        : `Your enrollment request for "${payload.courseTitle}" was declined`,
      courseId: payload.courseId,
    });
  }

  @OnEvent('notification.created')
  handleNotificationCreatedEvent(payload: any) {
    this.logger.debug(`Notification event: ${JSON.stringify(payload)}`);
  }
}
