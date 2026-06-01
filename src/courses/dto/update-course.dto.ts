import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCourseDto {
  @ApiPropertyOptional({
    description: 'Updated title of the course',
    example: 'Advanced JavaScript & TypeScript',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the course',
    example: 'Master advanced JavaScript and TypeScript concepts',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Toggle course active status (admin only)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
