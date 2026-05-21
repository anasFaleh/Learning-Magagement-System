import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from '../admin.service';

@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  findAll() {
    return [];
  }
}
