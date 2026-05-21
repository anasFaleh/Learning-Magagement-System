// dto/create-lecture.dto.ts
import { IsString, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateLectureDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsUrl()
  @IsOptional()
  documentUrl?: string;
}
