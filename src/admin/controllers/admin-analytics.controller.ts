import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Cacheable } from '../../common/decorators/cache.decorator';

@ApiTags('Admin - Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Cacheable('admin:stats', 300) // 5 min — stats don't change every second
  @ApiOperation({ summary: 'Get system analytics and statistics (admin only)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved' })
  async getStats(@Query() query: AnalyticsQueryDto) {
    return this.adminService.getSystemStats(query);
  }
}
