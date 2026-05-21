import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getStats(@Query() query: AnalyticsQueryDto) {
    // Connect to real admin service logic
    return this.adminService.getSystemStats(query);
  }
}
