import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EnableTwoFactorDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}
