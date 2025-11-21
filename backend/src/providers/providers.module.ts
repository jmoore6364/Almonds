import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AWSService } from './integrations/aws.service';
import { AzureService } from './integrations/azure.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProvidersController],
  providers: [ProvidersService, AWSService, AzureService],
  exports: [ProvidersService, AWSService, AzureService],
})
export class ProvidersModule {}
