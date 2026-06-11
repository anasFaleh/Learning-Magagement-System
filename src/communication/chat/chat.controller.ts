import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CourseEnrollmentGuard } from '../../common/guards/course-enrollment.guard';
import { CourseParam } from '../../common/decorators/course-param.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@Controller('courses/:courseId/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  @ApiOperation({ summary: 'Get course chat messages' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Messages retrieved' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not enrolled in course',
  })
  getMessages(
    @Param('courseId') courseId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.chatService.getMessages(courseId, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, CourseEnrollmentGuard)
  @CourseParam('courseId')
  @ApiOperation({ summary: 'Send a message to course chat' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not enrolled in course',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  sendMessage(
    @Param('courseId') courseId: string,
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(courseId, user.userId, dto);
  }
}
