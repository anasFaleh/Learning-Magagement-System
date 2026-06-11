import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  AdminController,
  AdminUsersController,
  AdminCoursesController,
  AdminAnalyticsController,
} from './controllers';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [PrismaModule, UsersModule, CoursesModule, EnrollmentModule],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminCoursesController,
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
