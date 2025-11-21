import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto, WebhookEvent, TestWebhookDto } from './dto/create-webhook.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  /**
   * Create a new webhook
   */
  async create(organizationId: string, userId: string, dto: CreateWebhookDto) {
    // Generate webhook secret for signature verification
    const secret = this.generateSecret();

    const webhook = await this.prisma.webhook.create({
      data: {
        organizationId,
        createdBy: userId,
        name: dto.name,
        description: dto.description,
        url: dto.url,
        secret,
        events: dto.events,
        enabled: true,
        headers: dto.headers || {},
        retryConfig: dto.retryConfig || {
          maxRetries: 3,
          retryDelayMs: 1000,
          backoffMultiplier: 2,
          timeout: 5000,
        },
      },
    });

    return {
      ...webhook,
      secret, // Only show secret on creation
    };
  }

  /**
   * Find all webhooks for an organization
   */
  async findAll(organizationId: string) {
    return this.prisma.webhook.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        url: true,
        events: true,
        enabled: true,
        status: true,
        headers: true,
        retryConfig: true,
        lastTriggered: true,
        createdAt: true,
        updatedAt: true,
        // Don't return secret for list
      },
    });
  }

  /**
   * Find one webhook by ID
   */
  async findOne(organizationId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        url: true,
        events: true,
        enabled: true,
        status: true,
        headers: true,
        retryConfig: true,
        lastTriggered: true,
        createdAt: true,
        updatedAt: true,
        // Don't return secret for get
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  /**
   * Update a webhook
   */
  async update(organizationId: string, id: string, dto: UpdateWebhookDto) {
    const webhook = await this.findOne(organizationId, id);

    return this.prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        name: dto.name,
        description: dto.description,
        url: dto.url,
        events: dto.events,
        enabled: dto.enabled,
        headers: dto.headers,
        retryConfig: dto.retryConfig,
      },
    });
  }

  /**
   * Delete a webhook
   */
  async remove(organizationId: string, id: string) {
    const webhook = await this.findOne(organizationId, id);

    await this.prisma.webhook.delete({
      where: { id: webhook.id },
    });

    return { message: 'Webhook deleted successfully' };
  }

  /**
   * Test a webhook by sending a test payload
   */
  async test(organizationId: string, id: string, dto: TestWebhookDto) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, organizationId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const testPayload = dto.payload || {
      id: 'test-' + Date.now(),
      type: 'resource',
      name: 'Test Resource',
      status: 'active',
    };

    // Trigger webhook
    const delivery = await this.triggerWebhook(webhook.id, dto.event, testPayload);

    return {
      message: 'Test webhook sent',
      delivery,
    };
  }

  /**
   * Get webhook deliveries (history)
   */
  async getDeliveries(organizationId: string, webhookId: string, limit: number = 50) {
    // Verify webhook belongs to organization
    await this.findOne(organizationId, webhookId);

    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Trigger a webhook (called by application events)
   */
  async triggerWebhook(webhookId: string, event: WebhookEvent, payload: any) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || !webhook.enabled) {
      return null;
    }

    // Check if webhook is subscribed to this event
    if (!webhook.events.includes(event)) {
      return null;
    }

    // Create delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload,
        status: 'pending',
        attempts: 0,
      },
    });

    // Deliver webhook asynchronously
    this.deliverWebhook(delivery.id, webhook, event, payload).catch((error) => {
      this.logger.error(`Failed to deliver webhook ${delivery.id}: ${error.message}`);
    });

    return delivery;
  }

  /**
   * Trigger webhooks for an event (called by application)
   */
  async triggerEvent(organizationId: string, event: WebhookEvent, payload: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organizationId,
        enabled: true,
        events: {
          has: event,
        },
      },
    });

    const deliveries = await Promise.all(
      webhooks.map((webhook) => this.triggerWebhook(webhook.id, event, payload)),
    );

    return deliveries.filter(Boolean);
  }

  /**
   * Deliver webhook with retry logic
   */
  private async deliverWebhook(deliveryId: string, webhook: any, event: WebhookEvent, payload: any) {
    const retryConfig = webhook.retryConfig || {
      maxRetries: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 2,
      timeout: 5000,
    };

    let attempt = 0;
    let lastError: string = '';

    while (attempt <= retryConfig.maxRetries) {
      try {
        const startTime = Date.now();

        // Create signature
        const timestamp = Date.now();
        const signature = this.createSignature(webhook.secret, timestamp, payload);

        // Prepare headers
        const headers = {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp.toString(),
          'X-Webhook-Delivery-Id': deliveryId,
          'User-Agent': 'Almonds-Webhooks/1.0',
          ...webhook.headers,
        };

        // Send webhook
        const response = await firstValueFrom(
          this.httpService.post(webhook.url, payload, {
            headers,
            timeout: retryConfig.timeout,
          }),
        );

        const responseTimeMs = Date.now() - startTime;

        // Update delivery as successful
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'success',
            statusCode: response.status,
            responseTimeMs,
            attempts: attempt + 1,
            deliveredAt: new Date(),
          },
        });

        // Update webhook status
        await this.prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            status: 'healthy',
            lastTriggered: new Date(),
          },
        });

        this.logger.log(`Webhook delivered successfully: ${deliveryId} (attempt ${attempt + 1})`);
        return;
      } catch (error) {
        attempt++;
        lastError = error.response?.data?.message || error.message;

        this.logger.warn(`Webhook delivery failed (attempt ${attempt}/${retryConfig.maxRetries + 1}): ${lastError}`);

        // Update attempt count
        await this.prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            attempts: attempt,
            status: attempt <= retryConfig.maxRetries ? 'retrying' : 'failed',
            statusCode: error.response?.status,
            errorMessage: lastError,
          },
        });

        // If we haven't exceeded max retries, wait and retry
        if (attempt <= retryConfig.maxRetries) {
          const delay = retryConfig.retryDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // Mark webhook as failing if multiple deliveries fail
    await this.updateWebhookHealthStatus(webhook.id);

    this.logger.error(`Webhook delivery failed after ${attempt} attempts: ${deliveryId}`);
  }

  /**
   * Update webhook health status based on recent deliveries
   */
  private async updateWebhookHealthStatus(webhookId: string) {
    // Get last 10 deliveries
    const recentDeliveries = await this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const failedCount = recentDeliveries.filter((d) => d.status === 'failed').length;

    // If more than 50% of recent deliveries failed, mark webhook as failing
    if (failedCount >= 5) {
      await this.prisma.webhook.update({
        where: { id: webhookId },
        data: { status: 'failing' },
      });
    }
  }

  /**
   * Create HMAC signature for webhook verification
   */
  private createSignature(secret: string, timestamp: number, payload: any): string {
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * Verify webhook signature (for webhook endpoint receiving webhooks)
   */
  verifySignature(secret: string, signature: string, timestamp: number, payload: any): boolean {
    const expectedSignature = this.createSignature(secret, timestamp, payload);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Generate random secret for webhooks
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(organizationId: string, id: string) {
    const webhook = await this.findOne(organizationId, id);

    const newSecret = this.generateSecret();

    await this.prisma.webhook.update({
      where: { id: webhook.id },
      data: { secret: newSecret },
    });

    return {
      message: 'Webhook secret regenerated',
      secret: newSecret,
    };
  }
}
