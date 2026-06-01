import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Title of the announcement',
    example: 'Important: Assignment Deadline Extended',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Full content of the announcement',
    example: 'Due to technical issues, the assignment deadline has been extended to next Friday',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
