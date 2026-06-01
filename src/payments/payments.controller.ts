import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Create checkout session for course purchase' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid course or coupon' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only students can checkout' })
  checkout(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: CheckoutDto,
  ) {
    return this.paymentsService.checkout(user.userId, dto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Get payment history for current student' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only students can access this' })
  getUserPayments(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paymentsService.getUserPayments(user.userId, page, limit);
  }
}
