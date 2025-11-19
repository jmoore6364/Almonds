import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';

export interface PlanLimits {
  organizations: number;
  resources: number;
  apiRequestsPerDay: number;
  members: number;
  providers: number;
}

@Injectable()
export class BillingService {
  private readonly planLimits: Record<string, PlanLimits> = {
    free: {
      organizations: 1,
      resources: 5,
      apiRequestsPerDay: 100,
      members: 3,
      providers: 2,
    },
    pro: {
      organizations: 3,
      resources: 50,
      apiRequestsPerDay: 1000,
      members: 10,
      providers: 5,
    },
    business: {
      organizations: 10,
      resources: 200,
      apiRequestsPerDay: 10000,
      members: 50,
      providers: 10,
    },
    enterprise: {
      organizations: -1, // unlimited
      resources: -1,
      apiRequestsPerDay: -1,
      members: -1,
      providers: -1,
    },
  };

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  async createCheckoutSession(organizationId: string, priceId: string, userId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get or create Stripe customer
    let customerId = organization.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripeService.createCustomer(
        `org-${organization.slug}@almonds.app`,
        organization.name,
        {
          organizationId: organization.id,
        },
      );

      customerId = customer.id;

      await this.prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8100');

    // Create checkout session
    const session = await this.stripeService.createCheckoutSession({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/billing/cancel`,
      metadata: {
        organizationId,
        userId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createBillingPortalSession(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization || !organization.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8100');

    const session = await this.stripeService.createBillingPortalSession(
      organization.stripeCustomerId,
      `${frontendUrl}/organizations/${organizationId}/billing`,
    });

    return {
      url: session.url,
    };
  }

  async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organizationId;

    if (!organizationId) {
      throw new Error('No organization ID in session metadata');
    }

    const subscription = await this.stripeService.getSubscription(session.subscription as string);

    // Determine plan from price
    const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan,
        subscriptionId: subscription.id,
      },
    });

    // Create subscription record
    await this.prisma.subscription.create({
      data: {
        organizationId,
        plan,
        status: subscription.status,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const organization = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) {
      return;
    }

    const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);

    await this.prisma.organization.update({
      where: { id: organization.id },
      data: { plan },
    });

    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        organizationId: organization.id,
        plan,
        status: subscription.status,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const organization = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) {
      return;
    }

    await this.prisma.organization.update({
      where: { id: organization.id },
      data: {
        plan: 'free',
        subscriptionId: null,
      },
    });

    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });
  }

  async trackUsage(organizationId: string, metricType: string, quantity: number) {
    await this.prisma.usageTracking.create({
      data: {
        organizationId,
        metricType,
        quantity,
        unit: metricType === 'api_requests' ? 'requests' : 'count',
      },
    });
  }

  async checkLimit(organizationId: string, limitType: keyof PlanLimits): Promise<boolean> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return false;
    }

    const limits = this.planLimits[organization.plan];

    if (!limits) {
      return false;
    }

    const limit = limits[limitType];

    // Unlimited
    if (limit === -1) {
      return true;
    }

    // Check current usage
    let currentCount = 0;

    switch (limitType) {
      case 'organizations':
        currentCount = await this.prisma.organizationMember.count({
          where: {
            user: {
              organizationMembers: {
                some: { organizationId },
              },
            },
          },
        });
        break;

      case 'resources':
        currentCount = await this.prisma.resource.count({
          where: { organizationId },
        });
        break;

      case 'apiRequestsPerDay':
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const usage = await this.prisma.usageTracking.aggregate({
          where: {
            organizationId,
            metricType: 'api_requests',
            timestamp: { gte: today },
          },
          _sum: { quantity: true },
        });

        currentCount = usage._sum.quantity || 0;
        break;

      case 'members':
        currentCount = await this.prisma.organizationMember.count({
          where: { organizationId },
        });
        break;

      case 'providers':
        currentCount = await this.prisma.cloudProvider.count({
          where: { organizationId },
        });
        break;
    }

    return currentCount < limit;
  }

  getPlanLimits(plan: string): PlanLimits {
    return this.planLimits[plan] || this.planLimits.free;
  }

  private getPlanFromPriceId(priceId: string): string {
    const priceIdMap: Record<string, string> = {
      [this.configService.get('STRIPE_PRICE_ID_PRO', 'price_pro')]: 'pro',
      [this.configService.get('STRIPE_PRICE_ID_BUSINESS', 'price_business')]: 'business',
    };

    return priceIdMap[priceId] || 'free';
  }
}
