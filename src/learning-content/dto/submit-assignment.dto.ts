// dto/submit-assignment.dto.ts
import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class SubmitAssignmentDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  fileUrl: string; // URL to uploaded file (e.g., cloud storage)
}
