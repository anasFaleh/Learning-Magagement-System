// dto/enroll-student.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EnrollStudentDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  paymentId?: string; // only provided when coming from payment webhook
}
