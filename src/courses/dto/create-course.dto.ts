// dto/create-course.dto.ts
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional() // optional for teacher; required for admin
  teacherId?: string;
}
