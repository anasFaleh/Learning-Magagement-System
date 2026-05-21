// dto/update-profile.dto.ts
import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsEmail()
  @IsOptional()
  email?: string; // only used by admin
}
