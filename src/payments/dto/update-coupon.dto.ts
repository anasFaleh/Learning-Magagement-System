import { IsString, IsOptional, IsNumber } from 'class-validator';
export class UpdateCouponDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsNumber() discountPercent?: number;
}
