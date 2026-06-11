import { IsString, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLectureDto {
  @ApiProperty({
    description: 'Title of the lecture',
    example: 'Introduction to JavaScript',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of lecture content',
    example:
      'This lecture covers the basics of JavaScript including variables, functions, and scope',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL to lecture video',
    example: 'https://example.com/videos/intro-javascript.mp4',
  })
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to supporting document or material',
    example: 'https://example.com/docs/javascript-guide.pdf',
  })
  @IsUrl()
  @IsOptional()
  documentUrl?: string;
}
