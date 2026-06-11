// communication.module.ts
import { Module } from '@nestjs/common';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { ChatGateway } from './chat/gateways/chat.gateway';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsListener } from './notifications/events/notifications.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    // ✅ Fix: JwtModule needed by ChatGateway for WebSocket token verification
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController, NotificationsController],
  providers: [
    ChatService,
    ChatGateway,
    NotificationsService,
    NotificationsListener,
  ],
  exports: [NotificationsService],
})
export class CommunicationModule {}
