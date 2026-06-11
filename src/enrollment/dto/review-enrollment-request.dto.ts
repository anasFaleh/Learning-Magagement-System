import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewEnrollmentRequestDto {
  @ApiProperty({
    enum: ReviewAction,
    description: 'APPROVE or REJECT the request',
  })
  @IsEnum(ReviewAction)
  action: ReviewAction;

  @ApiPropertyOptional({
    description: 'Optional note (e.g. reason for rejection)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
