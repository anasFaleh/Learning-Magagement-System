import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollStudentDto {
  @ApiProperty({
    description: 'The unique ID of the student to enroll',
    example: 'student-456',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiPropertyOptional({
    description: 'Payment ID (only provided from payment webhook)',
    example: 'payment-789',
  })
  @IsString()
  @IsOptional()
  paymentId?: string;
}
