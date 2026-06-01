import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'The title of the course',
    example: 'Advanced JavaScript',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'A detailed description of the course content',
    example: 'Master advanced JavaScript concepts including async/await, closures, and design patterns',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID of the teacher to assign to the course (optional for teachers, required for admins)',
    example: 'teacher-123',
  })
  @IsString()
  @IsOptional()
  teacherId?: string;
}
