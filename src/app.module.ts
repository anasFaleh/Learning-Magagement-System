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

@Module({
  imports: [
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
})
export class AppModule {}
