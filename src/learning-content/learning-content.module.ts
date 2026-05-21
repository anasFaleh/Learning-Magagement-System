import { Module } from '@nestjs/common';
import { LearningContentService } from './learning-content.service';
import { LecturesController } from './controllers/lectures.controller';
import { AssignmentsController } from './controllers/assignments.controller';
import { SubmissionsController } from './controllers/submissions.controller';
import { QuizzesController } from './controllers/quizzes.controller';
import { AnnouncementsController } from './controllers/announcements.controller';
import { CourseEnrollmentGuard } from './guards/course-enrollment.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [PrismaModule, CoursesModule],
  controllers: [
    LecturesController,
    AssignmentsController,
    SubmissionsController,
    QuizzesController,
    AnnouncementsController,
  ],
  providers: [LearningContentService, CourseEnrollmentGuard],
  exports: [LearningContentService],
})
export class LearningContentModule {}
