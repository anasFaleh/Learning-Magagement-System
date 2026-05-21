import { Controller, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaymentsService } from '../../payments/payments.service';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
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
