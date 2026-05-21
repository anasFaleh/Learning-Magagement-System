// communication.module.ts
import { Module } from '@nestjs/common';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController, NotificationsController],
  providers: [ChatService, NotificationsService],
  exports: [NotificationsService], // if needed elsewhere
})
export class CommunicationModule {}
