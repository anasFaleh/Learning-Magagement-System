import { SetMetadata } from '@nestjs/common';
export const AuditLog = () => SetMetadata('audit_log', true);
