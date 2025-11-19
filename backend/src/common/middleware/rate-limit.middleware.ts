import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests = new Map<string, { count: number; resetTime: number }>();
  private readonly limit = 100; // requests per window
  private readonly windowMs = 60 * 1000; // 1 minute

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip + ':' + (req.headers['user-agent'] || 'unknown');
    const now = Date.now();

    let record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + this.windowMs };
      this.requests.set(key, record);
    }

    record.count++;

    if (record.count > this.limit) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', this.limit.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

      throw new BadRequestException('Too many requests. Please try again later.');
    }

    res.setHeader('X-RateLimit-Limit', this.limit.toString());
    res.setHeader('X-RateLimit-Remaining', (this.limit - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    next();
  }
}
