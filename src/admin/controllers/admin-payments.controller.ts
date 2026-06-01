import { Controller, UseGuards, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaymentsService } from '../../payments/payments.service';

@ApiTags('Admin - Payments')
@ApiBearerAuth('JWT-auth')
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments (admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by payment status' })
  @ApiResponse({ status: 200, description: 'Payments retrieved' })
  getAllPayments(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('courseId') courseId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.getAllPayments({
      page,
      limit,
      courseId,
      status,
    });
  }
}
