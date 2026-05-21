import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsListener {
  @OnEvent('notification.created')
  handleNotificationCreatedEvent(payload: any) {
    console.log('Notification event received:', payload);
  }
}
