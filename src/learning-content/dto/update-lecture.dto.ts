import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
export class UpdateLectureDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
}
