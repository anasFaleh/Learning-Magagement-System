import { IsString, IsNotEmpty } from 'class-validator';
export class CreateAssignmentDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
}
