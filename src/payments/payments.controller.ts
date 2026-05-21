// payments.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  checkout(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: CheckoutDto,
  ) {
    return this.paymentsService.checkout(user.userId, dto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  getUserPayments(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paymentsService.getUserPayments(user.userId, page, limit);
  }
}
