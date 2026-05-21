import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LearningContentService } from '../learning-content.service';
import { CreateQuizDto } from '../dto/create-quiz.dto';
import { UpdateQuizDto } from '../dto/update-quiz.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('courses/:courseId/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(
    private readonly learningContentService: LearningContentService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async create(
    @Param('courseId') courseId: string,
    @Body() createQuizDto: CreateQuizDto,
  ) {
    // Logic would normally call service: return this.learningContentService.createQuiz(courseId, createQuizDto);
    return {
      message: 'Quiz created successfully for course ' + courseId,
      data: createQuizDto,
    };
  }

  @Get()
  async findAll(@Param('courseId') courseId: string) {
    return { message: 'Fetching all quizzes for course ' + courseId };
  }

  @Get(':id')
  async findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
    return { message: 'Fetching quiz ' + id + ' for course ' + courseId };
  }
}
