import { IsOptional, IsString } from 'class-validator';
export class AdminCourseQueryDto {
  @IsOptional() @IsString() search?: string;
}
