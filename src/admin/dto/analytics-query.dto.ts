import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for analytics (ISO 8601 format)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics (ISO 8601 format)',
    example: '2026-05-23',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
