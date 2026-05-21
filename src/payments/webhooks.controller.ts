// webhooks.controller.ts
import { Controller, Post, Req, Headers, RawBodyRequest, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentWebhookGuard } from './guards/payment-webhook.guard';

@Controller('payments/webhook')
export class WebhooksController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(PaymentWebhookGuard) // verifies Stripe signature
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // In a real implementation, you'd parse the event and extract the payment ID.
    // Here we assume the guard already verified and attached the parsed event to request.
    const event = (req as any).stripeEvent;
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      await this.paymentsService.confirmPayment(intent.id, intent.metadata);
    }
    return { received: true };
  }
}
