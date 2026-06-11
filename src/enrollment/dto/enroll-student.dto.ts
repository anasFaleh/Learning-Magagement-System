import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollStudentDto {
  @ApiProperty({ description: 'Student user ID' })
  @IsString()
  studentId: string;
}
