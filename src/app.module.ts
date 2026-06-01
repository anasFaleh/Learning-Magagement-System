import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { LearningContentModule } from './learning-content/learning-content.module';
import { CommunicationModule } from './communication/communication.module';
import { PaymentsModule } from './payments/payments.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { WinstonConfig } from './common/interceptors/logger.config';
import { WinstonModule } from 'nest-winston/dist/winston.module';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    WinstonModule.forRoot(WinstonConfig),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    LearningContentModule,
    CommunicationModule,
    PaymentsModule,
    EnrollmentModule,
    AdminModule,
  ],
  providers: [
    AllExceptionsFilter,
      {
        provide: APP_INTERCEPTOR,
        useClass: LoggerInterceptor,
      },
    ]
})
export class AppModule {}
