// create-coupon.dto.ts
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  title: string;

  @IsString()
  code: string;

  @IsInt()
  @Min(1)
  @Max(100)
  discountPercentage: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxUses?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignedUserIds?: string[];
}

// update-coupon.dto.ts – similar, all fields optional
