import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 1. حل مشكلة Passport OAuth2 الفنية مع Fastify Socket (encrypted)
    if (!request.connection) {
      request.connection = request.raw.socket || {};
    }
    // إجبار الكائن على احتواء الخاصية المفقودة لمنع خطأ 'encrypted'
    if (request.connection && request.connection.encrypted === undefined) {
      request.connection.encrypted = false; // أو true إذا كنت تستخدم HTTPS محلياً
    }

    // 2. حل مشكلة الـ Headers والـ Redirect المفقودة في Fastify
    if (!response.setHeader) {
      response.setHeader = (key: string, value: string) => {
        response.header(key, value);
        return response;
      };
    }

    if (!response.end) {
      response.end = (chunk: any) => {
        response.send(chunk);
      };
    }

    return (await super.canActivate(context)) as boolean;
  }

  getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }
}