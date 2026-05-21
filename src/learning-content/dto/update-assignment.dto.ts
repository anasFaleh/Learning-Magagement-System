import { IsString, IsOptional } from 'class-validator';
export class UpdateAssignmentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
}
