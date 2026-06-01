import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AdminCourseQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search courses by title or description',
    example: 'JavaScript',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
