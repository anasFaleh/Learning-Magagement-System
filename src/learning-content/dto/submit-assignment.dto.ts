import { IsString, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAssignmentDto {
  @ApiProperty({
    description: 'URL to student submission file (cloud storage)',
    example: 'https://example.com/submissions/student-123-assignment.pdf',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  fileUrl: string;
}
