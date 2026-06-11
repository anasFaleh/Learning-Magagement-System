import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({
    description: 'Updated announcement title',
    example: 'Important: Assignment Deadline Extended',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated announcement content',
    example:
      'Due to technical issues, the assignment deadline has been extended to next Friday',
  })
  @IsOptional()
  @IsString()
  content?: string;
}
