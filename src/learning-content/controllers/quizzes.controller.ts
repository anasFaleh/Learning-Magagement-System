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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LearningContentService } from '../learning-content.service';
import { CreateQuizDto } from '../dto/create-quiz.dto';
import { UpdateQuizDto } from '../dto/update-quiz.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Quizzes')
@ApiBearerAuth('JWT-auth')
@Controller('courses/:courseId/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizzesController {
  constructor(
    private readonly learningContentService: LearningContentService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new quiz (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid quiz data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only teachers and admins can create quizzes',
  })
  async create(
    @Param('courseId') courseId: string,
    @Body() createQuizDto: CreateQuizDto,
  ) {
    return {
      message: 'Quiz created successfully for course ' + courseId,
      data: createQuizDto,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all quizzes in a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findAll(@Param('courseId') courseId: string) {
    return { message: 'Fetching all quizzes for course ' + courseId };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific quiz' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz retrieved' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async findOne(@Param('courseId') courseId: string, @Param('id') id: string) {
    return { message: 'Fetching quiz ' + id + ' for course ' + courseId };
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a quiz (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only teachers and admins can update quizzes',
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    return { message: 'Quiz ' + id + ' updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a quiz (teacher/admin only)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only teachers and admins can delete quizzes',
  })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async remove(@Param('courseId') courseId: string, @Param('id') id: string) {
    return { message: 'Quiz ' + id + ' deleted successfully' };
  }
}
