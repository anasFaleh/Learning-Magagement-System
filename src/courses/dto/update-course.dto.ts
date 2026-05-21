// dto/update-course.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean; // only admin can change
}
