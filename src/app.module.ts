import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { LearningContentModule } from './learning-content/learning-content.module';
import { CommunicationModule } from './communication/communication.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { WinstonConfig } from './common/interceptors/logger.config';
import { WinstonModule } from 'nest-winston/dist/winston.module';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import Joi from 'joi';

@Module({
  imports: [
    // ✅ Config with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
        ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173'),
        FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
      }),
      validationOptions: { abortEarly: false },
    }),

    EventEmitterModule.forRoot(),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000,
            limit: config.get('NODE_ENV') === 'production' ? 60 : 1000,
          },
        ],
      }),
    }),

    WinstonModule.forRoot(WinstonConfig),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    LearningContentModule,
    CommunicationModule,
    EnrollmentModule,
    AdminModule,
  ],
  providers: [
    AllExceptionsFilter,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
})
export class AppModule {}
