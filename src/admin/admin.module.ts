// admin.module.ts
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  AdminController,
  AdminUsersController,
  AdminCoursesController,
  AdminPaymentsController,
  AdminCouponsController,
  AdminAnalyticsController,
} from './controllers';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { PaymentsModule } from '../payments/payments.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    CoursesModule,
    PaymentsModule,
    EnrollmentModule,
  ],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminCoursesController,
    AdminPaymentsController,
    AdminCouponsController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AdminModule {}
