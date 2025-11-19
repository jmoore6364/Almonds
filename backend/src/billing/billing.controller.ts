import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  RawBodyRequest,
  Req,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { CreateCheckoutDto, GetUsageDto } from './dto/billing.dto';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(
    private billingService: BillingService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiBearerAuth()
  async createCheckout(@Request() req, @Body() createCheckoutDto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(
      createCheckoutDto.organizationId,
      createCheckoutDto.priceId,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('portal')
  @ApiOperation({ summary: 'Create billing portal session' })
  @ApiBearerAuth()
  async createPortalSession(@Request() req, @Body('organizationId') organizationId: string) {
    return this.billingService.createBillingPortalSession(organizationId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event;

    try {
      event = await this.stripeService.constructWebhookEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.billingService.handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.billingService.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.billingService.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment
        console.log('Payment succeeded:', event.data.object.id);
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('plans')
  @ApiOperation({ summary: 'Get available plans and pricing' })
  @ApiBearerAuth()
  async getPlans() {
    const prices = await this.stripeService.listPrices();

    const plans = [
      {
        name: 'Free',
        price: 0,
        interval: 'month',
        features: [
          '1 organization',
          '5 resources',
          '100 API requests/day',
          '3 team members',
          '2 cloud providers',
          'Basic analytics',
        ],
        priceId: null,
        current: false,
      },
      {
        name: 'Pro',
        price: 29,
        interval: 'month',
        features: [
          '3 organizations',
          '50 resources',
          '1,000 API requests/day',
          '10 team members',
          '5 cloud providers',
          'Advanced analytics',
          'Email support',
        ],
        priceId: this.configService.get('STRIPE_PRICE_ID_PRO'),
        current: false,
      },
      {
        name: 'Business',
        price: 99,
        interval: 'month',
        features: [
          '10 organizations',
          '200 resources',
          '10,000 API requests/day',
          '50 team members',
          '10 cloud providers',
          'Premium analytics',
          'Priority support',
          'Custom integrations',
        ],
        priceId: this.configService.get('STRIPE_PRICE_ID_BUSINESS'),
        current: false,
      },
      {
        name: 'Enterprise',
        price: null,
        interval: 'custom',
        features: [
          'Unlimited organizations',
          'Unlimited resources',
          'Unlimited API requests',
          'Unlimited team members',
          'Unlimited cloud providers',
          'Dedicated account manager',
          '24/7 phone support',
          'SLA guarantees',
          'Custom contracts',
        ],
        priceId: null,
        current: false,
        contactSales: true,
      },
    ];

    return { plans, stripeActive: prices.data.length > 0 };
  }

  @UseGuards(JwtAuthGuard)
  @Get('usage')
  @ApiOperation({ summary: 'Get organization usage statistics' })
  @ApiBearerAuth()
  async getUsage(@Request() req, @Query() query: GetUsageDto) {
    const organizationId = query.organizationId;

    // Get current counts
    const [resourceCount, memberCount, providerCount, apiUsage] = await Promise.all([
      this.billingService['prisma'].resource.count({
        where: { organizationId },
      }),
      this.billingService['prisma'].organizationMember.count({
        where: { organizationId },
      }),
      this.billingService['prisma'].cloudProvider.count({
        where: { organizationId },
      }),
      this.getApiUsageToday(organizationId),
    ]);

    // Get organization plan
    const organization = await this.billingService['prisma'].organization.findUnique({
      where: { id: organizationId },
    });

    const limits = this.billingService.getPlanLimits(organization.plan);

    return {
      usage: {
        resources: resourceCount,
        members: memberCount,
        providers: providerCount,
        apiRequestsToday: apiUsage,
      },
      limits: {
        resources: limits.resources,
        members: limits.members,
        providers: limits.providers,
        apiRequestsPerDay: limits.apiRequestsPerDay,
      },
      plan: organization.plan,
    };
  }

  private async getApiUsageToday(organizationId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.billingService['prisma'].usageTracking.aggregate({
      where: {
        organizationId,
        metricType: 'api_requests',
        timestamp: { gte: today },
      },
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
  }
}
