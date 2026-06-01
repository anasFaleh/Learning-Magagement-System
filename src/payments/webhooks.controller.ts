import { Controller, Post, Req, Headers, RawBodyRequest, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentWebhookGuard } from './guards/payment-webhook.guard';

@ApiTags('Webhooks')
@Controller('payments/webhook')
export class WebhooksController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(PaymentWebhookGuard)
  @ApiOperation({ summary: 'Handle Stripe payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid webhook signature' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = (req as any).stripeEvent;
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      await this.paymentsService.confirmPayment(intent.id, intent.metadata);
    }
    return { received: true };
  }
}
