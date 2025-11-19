import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ example: 'org-id-123' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ example: 'price_1234567890' })
  @IsString()
  @IsNotEmpty()
  priceId: string;
}

export class GetUsageDto {
  @ApiProperty({ example: 'org-id-123' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
