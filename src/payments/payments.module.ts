// payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { CouponsController } from './coupons.controller';
import { AdminPaymentsController } from '../admin/controllers/admin-payments.controller';
import { PaymentWebhookGuard } from './guards/payment-webhook.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { EnrollmentModule } from '../enrollment/enrollment.module'; // ✅ use EnrollmentModule

@Module({
  imports: [PrismaModule, EnrollmentModule],
  controllers: [
    PaymentsController,
    WebhooksController,
    CouponsController,
    AdminPaymentsController,
  ],
  providers: [PaymentsService, PaymentWebhookGuard],
  exports: [PaymentsService],
})
export class PaymentsModule {}
