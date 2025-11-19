import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!apiKey || apiKey.startsWith('sk_test_your-')) {
      this.logger.warn('Stripe API key not configured - billing features disabled');
      return;
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
    });

    this.logger.log('Stripe configured successfully');
  }

  getStripe(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }
    return this.stripe;
  }

  async createCustomer(email: string, name: string, metadata?: Stripe.MetadataParam) {
    return this.getStripe().customers.create({
      email,
      name,
      metadata,
    });
  }

  async getCustomer(customerId: string) {
    return this.getStripe().customers.retrieve(customerId);
  }

  async updateCustomer(customerId: string, params: Stripe.CustomerUpdateParams) {
    return this.getStripe().customers.update(customerId, params);
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Stripe.MetadataParam,
  ) {
    return this.getStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });
  }

  async getSubscription(subscriptionId: string) {
    return this.getStripe().subscriptions.retrieve(subscriptionId);
  }

  async updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams,
  ) {
    return this.getStripe().subscriptions.update(subscriptionId, params);
  }

  async cancelSubscription(subscriptionId: string, immediately = false) {
    if (immediately) {
      return this.getStripe().subscriptions.cancel(subscriptionId);
    }

    return this.getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
    return this.getStripe().checkout.sessions.create(params);
  }

  async createBillingPortalSession(customerId: string, returnUrl: string) {
    return this.getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
    secret: string,
  ): Promise<Stripe.Event> {
    return this.getStripe().webhooks.constructEvent(payload, signature, secret);
  }

  async listPrices() {
    return this.getStripe().prices.list({
      active: true,
      expand: ['data.product'],
    });
  }

  async getUsage(subscriptionItemId: string) {
    return this.getStripe().subscriptionItems.listUsageRecordSummaries(
      subscriptionItemId,
    );
  }

  async reportUsage(subscriptionItemId: string, quantity: number, timestamp?: number) {
    return this.getStripe().subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment',
      },
    );
  }
}
