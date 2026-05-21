// checkout.dto.ts
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsOptional()
  couponCode?: string;
}
