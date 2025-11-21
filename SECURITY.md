# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Almonds seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Open a Public Issue

**Please do not report security vulnerabilities through public GitHub issues.** This could put all users at risk.

### 2. Report Privately

Send an email to: **security@almonds.io**

Include the following information:
- Type of vulnerability
- Full description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

### 3. What to Expect

- **Acknowledgment**: We'll acknowledge receipt within 24 hours
- **Assessment**: We'll assess the vulnerability within 48 hours
- **Updates**: We'll keep you informed of our progress
- **Resolution**: We aim to release a fix within 7 days for critical issues
- **Credit**: We'll credit you in the release notes (if desired)

### 4. Disclosure Policy

- Report the vulnerability privately first
- Allow us reasonable time to fix the issue
- We'll coordinate public disclosure with you
- We appreciate responsible disclosure

## Security Best Practices

### For Developers

#### Authentication & Authorization

```typescript
// ✅ Always hash passwords
const passwordHash = await bcrypt.hash(password, 10);

// ✅ Validate JWT tokens
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req) {
  return req.user;
}

// ✅ Check permissions
if (!this.verifyOwner(organizationId, userId)) {
  throw new ForbiddenException();
}
```

#### Input Validation

```typescript
// ✅ Always validate DTOs
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;
}

// ✅ Sanitize inputs
import { sanitize } from 'class-validator';
```

#### Database Security

```typescript
// ✅ Use parameterized queries (Prisma does this automatically)
await prisma.user.findUnique({
  where: { id: userId }
});

// ❌ Never concatenate user input
// await prisma.$queryRaw(`SELECT * FROM users WHERE id = ${userId}`);
```

#### API Security

```typescript
// ✅ Rate limiting
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Post('login')
async login() { }

// ✅ CORS configuration
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
});

// ✅ Security headers (Helmet)
app.use(helmet());
```

### For Deployment

#### Environment Variables

```bash
# ✅ Use strong secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# ✅ Never commit .env files
echo ".env" >> .gitignore
echo "*.env" >> .gitignore

# ❌ Never hardcode secrets
// const JWT_SECRET = "my-secret-key"; // BAD!
```

#### HTTPS/TLS

```nginx
# ✅ Always use HTTPS in production
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
}
```

#### Database

```bash
# ✅ Use strong database passwords
# ✅ Enable SSL connections
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# ✅ Regular backups
pg_dump almonds > backup_$(date +%Y%m%d).sql

# ✅ Restrict database access
# Only allow connections from application servers
```

#### Secrets Management

```bash
# ✅ Use secret management services
# - AWS Secrets Manager
# - Azure Key Vault
# - HashiCorp Vault
# - Kubernetes Secrets

# ✅ Rotate secrets regularly
# - JWT secrets: every 90 days
# - API keys: every 180 days
# - Database passwords: every 90 days
```

### For Users

#### Account Security

- **Use strong passwords**: At least 12 characters with mixed case, numbers, and symbols
- **Enable 2FA**: Add an extra layer of security to your account
- **Verify your email**: Complete email verification to secure your account
- **Review sessions**: Check for unauthorized access regularly

#### API Keys

- **Store securely**: Never commit API keys to version control
- **Use environment variables**: Store keys in .env files
- **Limit scopes**: Grant only necessary permissions
- **Rotate regularly**: Change API keys every 90 days
- **Monitor usage**: Check for unusual API activity

#### OAuth Tokens

- **Review permissions**: Only grant necessary OAuth scopes
- **Revoke unused**: Remove OAuth connections you don't use
- **Use refresh tokens**: Don't store access tokens long-term

## Known Security Features

### Implemented Protections

- **Password Hashing**: bcrypt with 10 rounds
- **JWT Authentication**: HS256 algorithm with expiration
- **2FA Support**: TOTP-based two-factor authentication
- **Email Verification**: Secure token-based verification
- **Rate Limiting**: 100 requests/minute default
- **CORS**: Configured for specific origins
- **Helmet**: Security headers middleware
- **Input Validation**: class-validator for all DTOs
- **SQL Injection Protection**: Prisma ORM parameterized queries
- **XSS Protection**: Output sanitization
- **CSRF Protection**: Token-based for state changes

### Additional Security Layers

#### Network Security

- Kubernetes Network Policies
- Load balancer with DDoS protection
- Web Application Firewall (WAF)
- TLS 1.2+ only

#### Application Security

- Regular dependency updates
- Security scanning in CI/CD
- Automated vulnerability detection
- Code review process

#### Data Security

- Encryption at rest (database level)
- Encryption in transit (HTTPS)
- Regular automated backups
- Data retention policies

## Security Checklist for Production

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS/TLS certificates installed
- [ ] Database passwords rotated
- [ ] SendGrid API key configured
- [ ] Stripe webhook secrets set
- [ ] CORS origins configured
- [ ] Rate limits configured
- [ ] Security headers enabled (Helmet)
- [ ] Input validation on all endpoints

### Post-Deployment

- [ ] Regular security updates scheduled
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Incident response plan documented
- [ ] Security audit logs enabled
- [ ] Vulnerability scanning automated

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1**: Acknowledgment sent
3. **Day 2**: Initial assessment complete
4. **Day 7**: Fix developed and tested
5. **Day 10**: Patch released
6. **Day 14**: Public disclosure (if applicable)

## Security Advisories

Security advisories will be published at:
- **GitHub**: https://github.com/almonds/almonds/security/advisories
- **Website**: https://almonds.io/security
- **Email**: security-announce@almonds.io (subscribe)

## Hall of Fame

We recognize security researchers who help keep Almonds secure:

- *List of researchers who reported vulnerabilities*

## Bounty Program

We currently do not have a formal bug bounty program, but we:
- Recognize contributors in release notes
- Provide public acknowledgment (if desired)
- May offer rewards for critical vulnerabilities

## Security Updates

Stay informed about security updates:
- Watch our [GitHub repository](https://github.com/almonds/almonds)
- Subscribe to [security announcements](https://almonds.io/security)
- Follow [@almondsapp](https://twitter.com/almondsapp)

## Compliance

Almonds follows security best practices from:
- OWASP Top 10
- CWE/SANS Top 25
- NIST Cybersecurity Framework
- SOC 2 Type II guidelines

## Contact

- **Security issues**: security@almonds.io
- **General inquiries**: support@almonds.io
- **Emergency contact**: +1-XXX-XXX-XXXX (for critical issues only)

---

**Thank you for helping keep Almonds and our users safe!**

*Last updated: 2025-01-20*
