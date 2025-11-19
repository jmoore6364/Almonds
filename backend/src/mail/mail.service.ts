import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey && apiKey !== 'your-sendgrid-api-key') {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid configured successfully');
    } else {
      this.logger.warn('SendGrid API key not configured - emails will be logged only');
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    const from = {
      email: this.configService.get<string>('FROM_EMAIL', 'noreply@almonds.app'),
      name: this.configService.get<string>('FROM_NAME', 'Almonds Team'),
    };

    const msg = {
      to,
      from,
      subject,
      text: text || subject,
      html,
    };

    try {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

      if (!apiKey || apiKey === 'your-sendgrid-api-key') {
        // Development mode - just log the email
        this.logger.log('📧 [DEV MODE] Email would be sent:');
        this.logger.log(`To: ${to}`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log(`Body: ${text || html}`);
        return { success: true, mode: 'dev' };
      }

      await sgMail.send(msg);
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return { success: true, mode: 'production' };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8100');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Almonds! 🎉</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for signing up for Almonds Resource Manager!</p>
              <p>To complete your registration and start managing your cloud resources, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with Almonds, please ignore this email.</p>
              <p>Best regards,<br>The Almonds Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Almonds Resource Manager. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to Almonds!

Hi ${name},

Thank you for signing up for Almonds Resource Manager!

To complete your registration, please verify your email address by clicking this link:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with Almonds, please ignore this email.

Best regards,
The Almonds Team
    `;

    return this.sendEmail(email, 'Verify your Almonds account', html, text);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8100');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request 🔐</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your password for your Almonds account.</p>
              <p>Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
              </div>
              <p>Best regards,<br>The Almonds Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Almonds Resource Manager. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request

Hi ${name},

We received a request to reset your password for your Almonds account.

Click this link to create a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.

Best regards,
The Almonds Team
    `;

    return this.sendEmail(email, 'Reset your Almonds password', html, text);
  }

  async sendWelcomeEmail(email: string, name: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:8100');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .feature { margin: 15px 0; padding-left: 30px; position: relative; }
            .feature:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; font-size: 20px; }
            .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Almonds! 🚀</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Your email has been verified successfully! You're all set to start managing your multi-cloud resources.</p>

              <h3>What you can do with Almonds:</h3>
              <div class="feature">Connect multiple cloud providers (AWS, Azure, GCP)</div>
              <div class="feature">Monitor resources in real-time across all platforms</div>
              <div class="feature">Track costs and optimize spending</div>
              <div class="feature">Set up automated workflows and alerts</div>
              <div class="feature">Collaborate with your team using organizations</div>

              <div style="text-align: center;">
                <a href="${frontendUrl}/dashboard" class="button">Get Started</a>
              </div>

              <p>Need help? Check out our <a href="${frontendUrl}/docs">documentation</a> or reply to this email.</p>

              <p>Happy cloud managing!<br>The Almonds Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Almonds Resource Manager. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, 'Welcome to Almonds - Get Started!', html);
  }
}
