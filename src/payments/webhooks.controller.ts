// webhooks.controller.ts
import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentWebhookGuard } from './guards/payment-webhook.guard';

@ApiTags('Webhooks')
@Controller('payments/webhook')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(PaymentWebhookGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Stripe payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(@Req() req: any) {
    const event = req.stripeEvent;

    // ✅ Fix: guard against missing stripeEvent (should not happen, but defensive)
    if (!event) {
      this.logger.warn('Webhook received but stripeEvent missing from request');
      return { received: true };
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const intent = event.data.object;
          await this.paymentsService.confirmPayment(intent.id, intent.metadata);
          this.logger.log(`Processed payment_intent.succeeded: ${intent.id}`);
          break;
        }
        // ✅ Fix: handle payment failure to mark payment as FAILED in DB
        case 'payment_intent.payment_failed': {
          const intent = event.data.object;
          this.logger.warn(`Payment failed: ${intent.id}`);
          // Optionally update Payment status to FAILED here
          break;
        }
        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      // ✅ Fix: log error but always return 200 so Stripe doesn't retry unnecessarily
      this.logger.error(
        `Error processing webhook event ${event.type}: ${event.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return { received: true };
  }
}
