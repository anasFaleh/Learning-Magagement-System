import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollStudentDto {
  @ApiProperty({
    description: 'The unique ID of the student to enroll in the course',
    example: 'student-456',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;
}
