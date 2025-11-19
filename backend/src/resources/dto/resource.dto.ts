import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({ example: 'org-id-123' })
  @IsString()
  organizationId: string;

  @ApiProperty({ example: 'provider-id-123' })
  @IsString()
  providerId: string;

  @ApiProperty({ example: 'i-1234567890abcdef0' })
  @IsString()
  externalId: string;

  @ApiProperty({ example: 'Production API Server' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'compute' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'aws' })
  @IsString()
  provider: string;

  @ApiProperty({ example: 'active', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: 'us-east-1', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: { environment: 'production' }, required: false })
  @IsOptional()
  @IsObject()
  tags?: any;

  @ApiProperty({ example: { instanceType: 't3.medium' }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ example: 49.99, required: false })
  @IsOptional()
  @IsNumber()
  costPerMonth?: number;
}

export class UpdateResourceDto {
  @ApiProperty({ example: 'Production API Server', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'active', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: { environment: 'production' }, required: false })
  @IsOptional()
  @IsObject()
  tags?: any;

  @ApiProperty({ example: { instanceType: 't3.medium' }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ example: 49.99, required: false })
  @IsOptional()
  @IsNumber()
  costPerMonth?: number;
}
