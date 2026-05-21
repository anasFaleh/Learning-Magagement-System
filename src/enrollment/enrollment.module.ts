// enrollment.module.ts
import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentGuard } from './guards/enrollment.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesModule } from 'src/courses/courses.module';

@Module({
  imports: [PrismaModule, CoursesModule],
  controllers: [EnrollmentController],
  providers: [EnrollmentService, EnrollmentGuard],
  exports: [EnrollmentService, EnrollmentGuard],
})
export class EnrollmentModule {}
