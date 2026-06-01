import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateQuizDto {
  @ApiPropertyOptional({
    description: 'Updated quiz title',
    example: 'Advanced JavaScript Quiz',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated array of quiz questions',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  questions?: any[];
}
