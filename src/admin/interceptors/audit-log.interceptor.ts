// interceptors/audit-log.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || user.role !== 'ADMIN') return next.handle();

    const { method, path, params, body } = request;

    return next.handle().pipe(
      tap(async (result) => {
        await this.prisma.auditLog.create({
          data: {
            adminId: user.userId,
            action: `${method}:${path}`,
            resource: context.getClass().name, // or extract from path
            details: { params, body, result },
          },
        });
      }),
    );
  }
}
