import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({
    description: 'Human-readable title for the coupon',
    example: 'Summer Discount',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Unique coupon code used for redemption',
    example: 'SAVE20',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Discount percentage (1-100)',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercentage: number;

  @ApiPropertyOptional({
    description: 'Additional description of the coupon',
    example: 'Valid for all JavaScript courses',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of times coupon can be used (0 = unlimited)',
    example: 100,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  maxUses?: number;

  @ApiPropertyOptional({
    description: 'Array of user IDs eligible for this coupon',
    isArray: true,
    example: ['user-1', 'user-2'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignedUserIds?: string[];
}
