// dto/login.dto.ts
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // 👈 Imported Swagger ApiProperty

export class LoginDto {
  @ApiProperty({
    description: 'The unique email address of the user',
    example: 'anas.faleh@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The secure password for the user account',
    example: 'StrongPassword123!',
  })
  @IsString()
  password!: string;
}