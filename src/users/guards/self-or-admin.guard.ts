// guards/self-or-admin.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SELF_OR_ADMIN_KEY } from '../decorators/self-or-admin.decorator';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const paramName = this.reflector.get<string>(
      SELF_OR_ADMIN_KEY,
      context.getHandler(),
    );
    if (!paramName) return true; // guard not applied

    const request = context.switchToHttp().getRequest();
    const user = request.user; // attached by JwtAuthGuard
    const resourceId = request.params[paramName];

    if (user.role === 'ADMIN') return true;
    if (user.userId === resourceId) return true;

    throw new ForbiddenException(
      'Access denied – you can only modify your own resources',
    );
  }
}
