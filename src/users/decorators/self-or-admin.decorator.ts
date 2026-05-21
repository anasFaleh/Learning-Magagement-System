// decorators/self-or-admin.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const SELF_OR_ADMIN_KEY = 'selfOrAdmin';
export const SelfOrAdmin = (paramName: string = 'id') =>
  SetMetadata(SELF_OR_ADMIN_KEY, paramName);
