// guards/payment-webhook.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentWebhookGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const sig = request.headers['stripe-signature'];
    if (!sig) return false;

    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!secretKey || !webhookSecret) return false;

    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-08-16',
    });

    try {
      const event = stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        webhookSecret,
      );
      request.stripeEvent = event;
      return true;
    } catch (err) {
      return false;
    }
  }
}
