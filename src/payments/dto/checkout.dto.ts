import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({
    description: 'ID of the course to purchase',
    example: 'course-123',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiPropertyOptional({
    description: 'Coupon code for discount (optional)',
    example: 'SAVE20',
  })
  @IsString()
  @IsOptional()
  couponCode?: string;
}
