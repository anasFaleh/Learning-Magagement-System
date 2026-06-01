import { IsString, IsOptional } from 'class-validator';
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
    description: 'Updated lecture content',
    example: 'Updated content covering closures and prototypes',
  })
  @IsOptional()
  @IsString()
  content?: string;
}
