#!/usr/bin/env node

/**
 * Check if all required environment variables are set
 *
 * Usage:
 *   node scripts/check-env.js
 *   NODE_ENV=production node scripts/check-env.js
 */

const requiredVars = {
  development: [
    'DATABASE_URL',
    'JWT_SECRET',
  ],
  production: [
    'DATABASE_URL',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
    'ENCRYPTION_KEY',
    'FRONTEND_URL',
    'CORS_ORIGIN',
  ],
};

const env = process.env.NODE_ENV || 'development';
const required = requiredVars[env] || requiredVars.development;

console.log(`\n🔍 Checking environment variables for: ${env}\n`);

const missing = [];
const weak = [];
const good = [];

required.forEach((varName) => {
  const value = process.env[varName];

  if (!value) {
    missing.push(varName);
    console.log(`❌ ${varName}: MISSING`);
  } else if (value.includes('REPLACE') || value.includes('your-') || value.includes('change-this')) {
    weak.push(varName);
    console.log(`⚠️  ${varName}: SET (but using placeholder value)`);
  } else {
    good.push(varName);
    console.log(`✅ ${varName}: SET`);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✅ Good: ${good.length}`);
console.log(`⚠️  Weak: ${weak.length}`);
console.log(`❌ Missing: ${missing.length}`);
console.log('='.repeat(50));

if (missing.length > 0) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please set the following variables in your .env file:');
  missing.forEach((v) => console.log(`  - ${v}`));
  process.exit(1);
}

if (env === 'production' && weak.length > 0) {
  console.log('\n⚠️  WARNING: Some variables are using placeholder values!');
  console.log('Please update the following in your .env.production file:');
  weak.forEach((v) => console.log(`  - ${v}`));
  process.exit(1);
}

console.log('\n✅ Environment check passed!\n');
process.exit(0);
