// coupons.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CouponsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async createCoupon(@Body() dto: CreateCouponDto) {
    const { assignedUserIds, ...couponData } = dto;
    const coupon = await this.prisma.coupon.create({
      data: {
        ...couponData,
        assignedUsers: assignedUserIds
          ? { create: assignedUserIds.map((userId) => ({ userId })) }
          : undefined,
      },
    });
    return coupon;
  }

  @Get()
  async listCoupons() {
    return this.prisma.coupon.findMany({ include: { assignedUsers: true } });
  }

  @Patch(':id')
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    // ... handle updating assignedUsers separately
  }

  @Delete(':id')
  async deleteCoupon(@Param('id') id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
