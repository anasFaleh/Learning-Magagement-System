// courses.module.ts
import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseOwnershipGuard } from './guards/course-ownership.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CoursesController],
  providers: [CoursesService, CourseOwnershipGuard],
  exports: [CoursesService], // for future Content module
})
export class CoursesModule {}
