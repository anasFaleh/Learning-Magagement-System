import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAssignmentDto {
  @ApiPropertyOptional({
    description: 'Updated assignment title',
    example: 'Build an Advanced Todo App',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated assignment description',
    example: 'Create an advanced todo app with categories and due dates',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
