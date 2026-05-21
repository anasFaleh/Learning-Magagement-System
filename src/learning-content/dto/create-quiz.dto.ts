import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
export class CreateQuizDto {
  @IsString() @IsNotEmpty() title: string;
  @IsArray() questions: any[];
}
