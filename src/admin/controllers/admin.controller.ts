// admin.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AdminService } from '../admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return { message: 'Admin dashboard' };
  }
}
