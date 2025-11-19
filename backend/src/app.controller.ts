import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  @ApiOperation({ summary: 'API info' })
  getInfo() {
    return {
      name: 'Almonds Resource Manager API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}
