import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: 'org-id-123' })
  @IsString()
  organizationId: string;

  @ApiProperty({ example: 'aws' })
  @IsString()
  provider: string;

  @ApiProperty({ example: 'AWS Production Account' })
  @IsString()
  name: string;

  @ApiProperty({ example: { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' } })
  @IsObject()
  credentials: any;

  @ApiProperty({ example: 'us-east-1', required: false })
  @IsOptional()
  @IsString()
  region?: string;
}

export class UpdateProviderDto {
  @ApiProperty({ example: 'AWS Production Account', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'active', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: { accessKeyId: 'AKIAIOSFODNN7EXAMPLE' }, required: false })
  @IsOptional()
  @IsObject()
  credentials?: any;

  @ApiProperty({ example: 'us-east-1', required: false })
  @IsOptional()
  @IsString()
  region?: string;
}
