import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

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

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const errRes = exception.getResponse();
      message = typeof errRes === 'string' ? errRes : (errRes as any).message;

      this.logger.warn(
        `${request.method} ${request.url} - ${httpStatus} - ${exception.name}`,
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
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
      httpStatus,
    );
  }
}
