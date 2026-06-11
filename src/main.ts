import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 10485760 }),
    { bufferLogs: true },
  );

  const config = app.get(ConfigService);
  const isProduction = config.get('NODE_ENV') === 'production';

  // ✅ CRITICAL: Socket.IO adapter — must be set BEFORE listen()
  // Fastify doesn't natively support socket.io, so we use NestJS IoAdapter
  // which runs socket.io on a separate http server attached to Fastify
  app.useWebSocketAdapter(new IoAdapter(app));

  // ✅ Security headers
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: isProduction,
  });

  // ✅ Rate limiting
  await app.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req: any) => req.ip,
  });

  // ✅ Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(app.get(AllExceptionsFilter));

  // ✅ CORS
  const allowedOrigins = config
    .get<string>('ALLOWED_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: isProduction ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ✅ Swagger (dev only)
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LMS Platform API')
      .setDescription('Learning Management System API — Enrollment by Request')
      .setVersion('2.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger available at /api/docs');
  }

  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Server running on port ${port} [${config.get('NODE_ENV')}]`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
