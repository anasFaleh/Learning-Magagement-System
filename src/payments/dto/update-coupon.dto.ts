import { IsString, IsOptional, IsNumber, IsInt, Min, Max, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCouponDto {
  @ApiPropertyOptional({
    description: 'Updated coupon code',
    example: 'SAVE25',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Updated discount percentage (1-100)',
    example: 25,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Updated coupon title',
    example: 'Updated Summer Discount',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated coupon description',
    example: 'Now valid for all courses',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated max uses',
    example: 150,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxUses?: number;

  @ApiPropertyOptional({
    description: 'Updated list of user IDs eligible for this coupon',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedUserIds?: string[];
}
