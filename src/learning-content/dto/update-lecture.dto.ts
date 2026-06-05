import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLectureDto {
  @ApiPropertyOptional({
    description: 'Updated lecture title',
    example: 'Advanced JavaScript Concepts',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated lecture description',
    example: 'Updated description covering closures and prototypes',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated lecture video URL',
  })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Updated lecture document URL',
  })
  @IsOptional()
  @IsUrl()
  documentUrl?: string;
}
