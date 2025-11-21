import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    // Generate email verification token
    const emailVerificationToken = this.generateToken();

    // Create user
    const user = await this.usersService.create({
      email: registerDto.email,
      name: registerDto.name,
      passwordHash,
      emailVerificationToken,
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      emailVerificationToken,
    );

    return this.login(user);
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Mark email as verified and clear token
    await this.usersService.verifyEmail(user.id);

    // Send welcome email
    await this.mailService.sendWelcomeEmail(user.email, user.name);

    return {
      message: 'Email verified successfully',
      verified: true,
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new verification token
    const emailVerificationToken = this.generateToken();
    await this.usersService.updateVerificationToken(user.id, emailVerificationToken);

    // Send verification email
    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      emailVerificationToken,
    );

    return {
      message: 'Verification email sent',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If an account exists with this email, a password reset link has been sent',
      };
    }

    // Generate password reset token
    const resetToken = this.generateToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.updatePasswordResetToken(user.id, resetToken, resetExpiry);

    // Send password reset email
    await this.mailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    return {
      message: 'If an account exists with this email, a password reset link has been sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByPasswordResetToken(resetPasswordDto.token);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(resetPasswordDto.password, salt);

    // Update password and clear reset token
    await this.usersService.updatePassword(user.id, passwordHash);

    return {
      message: 'Password reset successfully',
    };
  }

  async oauthLogin(oauthUser: { email: string; name: string; avatarUrl?: string; provider: string; providerId: string }) {
    // Check if user exists
    let user = await this.usersService.findByEmail(oauthUser.email);

    if (!user) {
      // Create new user from OAuth profile
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10); // Random password

      user = await this.usersService.create({
        email: oauthUser.email,
        name: oauthUser.name,
        passwordHash,
        emailVerificationToken: null, // OAuth accounts are pre-verified
      });

      // Update emailVerified to true for OAuth users
      await this.usersService.verifyEmail(user.id);

      // Update avatar if provided
      if (oauthUser.avatarUrl) {
        await this.usersService.update(user.id, { avatarUrl: oauthUser.avatarUrl });
      }

      // Send welcome email
      await this.mailService.sendWelcomeEmail(user.email, user.name);
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return this.login(user);
  }

  async generateTwoFactorSecret(userId: string) {
    const user = await this.usersService.findById(userId, true);

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Almonds (${user.email})`,
      issuer: 'Almonds',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret to user (temporarily, until verified)
    await this.usersService.updateTwoFactorSecret(userId, secret.base32);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.usersService.findById(userId, true);

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor secret not generated. Call generate-2fa first');
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before/after
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable 2FA
    await this.usersService.enableTwoFactor(userId);

    return {
      message: 'Two-factor authentication enabled successfully',
      enabled: true,
    };
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.usersService.findById(userId, true);

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify the code before disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable 2FA
    await this.usersService.disableTwoFactor(userId);

    return {
      message: 'Two-factor authentication disabled successfully',
      enabled: false,
    };
  }

  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersService.findById(userId, true);

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
