// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SelfOrAdminGuard } from './guards/self-or-admin.guard';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, SelfOrAdminGuard],
  exports: [UsersService], // needed by Course module to verify user activity
})
export class UsersModule {}
