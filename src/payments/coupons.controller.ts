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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin - Coupons')
@ApiBearerAuth('JWT-auth')
@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CouponsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new coupon (admin only)' })
  @ApiResponse({ status: 201, description: 'Coupon created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid coupon data' })
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
  @ApiOperation({ summary: 'List all coupons (admin only)' })
  @ApiResponse({ status: 200, description: 'Coupons retrieved' })
  async listCoupons() {
    return this.prisma.coupon.findMany({ include: { assignedUsers: true } });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a coupon (admin only)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({ status: 200, description: 'Coupon updated successfully' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    // Handle updating assignedUsers separately
    return this.prisma.coupon.update({
      where: { id },
      data: dto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a coupon (admin only)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({ status: 200, description: 'Coupon deleted successfully' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async deleteCoupon(@Param('id') id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
