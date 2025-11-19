import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123def456...' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123def456...' })
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}
