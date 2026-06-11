import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnrollmentRequestDto {
  @ApiProperty({ description: 'Course ID to request enrollment for' })
  @IsString()
  courseId: string;

  @ApiPropertyOptional({ description: 'Optional message to the teacher' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
