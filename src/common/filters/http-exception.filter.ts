import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let httpStatus = 500;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const errRes = exception.getResponse();
      message = typeof errRes === 'string' ? errRes : (errRes as any).message;
      error = typeof errRes === 'object' ? (errRes as any).error : undefined;

      this.logger.warn(
        `${request.method} ${request.url} - ${httpStatus} - ${exception.name}`,
      );
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors with meaningful messages
      switch (exception.code) {
        case 'P2002':
          // Unique constraint violation
          httpStatus = 409;
          message = 'A record with this value already exists';
          error = 'Conflict';
          break;
        case 'P2025':
          // Record not found
          httpStatus = 404;
          message = 'Record not found';
          error = 'Not Found';
          break;
        case 'P2003':
          // Foreign key constraint
          httpStatus = 400;
          message = 'Related record does not exist';
          error = 'Bad Request';
          break;
        case 'P2014':
          // Required relation violation
          httpStatus = 400;
          message = 'The change would violate a required relation';
          error = 'Bad Request';
          break;
        default:
          httpStatus = 500;
          message = 'Database error';
          error = 'Internal Server Error';
      }

      this.logger.warn(
        `Prisma error ${exception.code} on ${request.method} ${request.url} - ${JSON.stringify(exception.meta)}`,
      );
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      httpStatus = 400;
      message = 'Invalid data provided';
      error = 'Bad Request';

      this.logger.warn(
        `Prisma validation error on ${request.method} ${request.url}`,
      );
    } else {
      // Unexpected error — log full stack trace internally, never expose details to client
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    httpAdapter.reply(
      response,
      {
        statusCode: httpStatus,
        error,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
      httpStatus,
    );
  }
}
