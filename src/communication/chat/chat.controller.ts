// chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CourseEnrollmentGuard } from '../guards/course-enrollment.guard'; // shared
import { CourseParam } from '../guards/course-param.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('courses/:courseId/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  getMessages(
    @Param('courseId') courseId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.chatService.getMessages(courseId, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  sendMessage(
    @Param('courseId') courseId: string,
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(courseId, user.userId, dto);
  }
}
