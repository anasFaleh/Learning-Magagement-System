// payments.module.ts
import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { CouponsController } from './coupons.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { PaymentWebhookGuard } from './guards/payment-webhook.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesModule } from '../courses/courses.module'; // to access CoursesService

@Module({
  imports: [PrismaModule, CoursesModule],
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
