import { IsString, IsOptional, IsArray } from 'class-validator';
export class UpdateQuizDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsArray() questions?: any[];
}
