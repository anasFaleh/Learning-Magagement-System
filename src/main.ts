import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; 
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Global Validation Configuration
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(app.get(AllExceptionsFilter));
  // 1. Configure Swagger Options (Completely in English)
  const config = new DocumentBuilder()
    .setTitle('LMS Platform API')
    .setDescription('The Learning Management System API core documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your valid JWT token to access protected endpoints',
        in: 'header',
      },
      'JWT-auth', // This credential name will be linked to the controllers later
    )
    .build();

  // 2. Create the API Document
  const document = SwaggerModule.createDocument(app, config);

  // 3. Setup Swagger Endpoint Path (/api/docs)
  SwaggerModule.setup('api/docs', app, document);

  // Global CORS configuration
  app.enableCors();

  await app.listen(3000, '0.0.0.0');
  
  console.log(`🚀 Server compiled and successfully running on port 3000`);
  console.log(`📄 Swagger UI is fully operational at: http://localhost:3000/api/docs`);
}
bootstrap();