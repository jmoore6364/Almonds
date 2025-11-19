import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth, ApiQuery, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ResendVerificationDto } from './dto/auth.dto';
import { EnableTwoFactorDto, VerifyTwoFactorDto } from './dto/twofa.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiBearerAuth()
  async logout(@Request() req) {
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBearerAuth()
  async refresh(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiQuery({ name: 'token', required: true })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendDto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // OAuth - Google
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Login with Google OAuth' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.oauthLogin(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8100');

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  // OAuth - GitHub
  @Get('github')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'Login with GitHub OAuth' })
  async githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @ApiExcludeEndpoint()
  async githubAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.oauthLogin(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8100');

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  // Two-Factor Authentication
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiBearerAuth()
  async generateTwoFactor(@Request() req) {
    return this.authService.generateTwoFactorSecret(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiBearerAuth()
  async enableTwoFactor(@Request() req, @Body() enableDto: EnableTwoFactorDto) {
    return this.authService.enableTwoFactor(req.user.userId, enableDto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiBearerAuth()
  async disableTwoFactor(@Request() req, @Body() verifyDto: VerifyTwoFactorDto) {
    return this.authService.disableTwoFactor(req.user.userId, verifyDto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify two-factor code' })
  @ApiBearerAuth()
  async verifyTwoFactor(@Request() req, @Body() verifyDto: VerifyTwoFactorDto) {
    const verified = await this.authService.verifyTwoFactorCode(req.user.userId, verifyDto.code);
    return {
      verified,
      message: verified ? 'Code verified successfully' : 'Invalid code',
    };
  }
}
