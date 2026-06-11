// dto/register.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // 👈 Imported Swagger properties

export class RegisterDto {
  @ApiProperty({
    description: 'The unique email address for the new user account',
    example: 'anas.faleh@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'A secure password for the account (Must be between 8 and 128 characters)',
    example: 'StrongPassword123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    description: 'The first name of the user',
    example: 'Anas',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'The last name or family name of the user',
    example: 'Al-Faleh',
  })
  @IsString()
  @IsOptional()
  lastName?: string;
}