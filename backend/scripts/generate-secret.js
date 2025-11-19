#!/usr/bin/env node

/**
 * Generate secure random secrets for production use
 *
 * Usage:
 *   node scripts/generate-secret.js
 *   node scripts/generate-secret.js 64  # Specify length in bytes
 */

const crypto = require('crypto');

const length = parseInt(process.argv[2]) || 32; // Default to 32 bytes (256 bits)

const secret = crypto.randomBytes(length).toString('hex');

console.log('\n🔐 Generated Secret:');
console.log('='.repeat(50));
console.log(secret);
console.log('='.repeat(50));
console.log(`Length: ${secret.length} characters (${length} bytes)`);
console.log('\nUse this for JWT_SECRET or ENCRYPTION_KEY in your .env file');
console.log('⚠️  Keep this secret safe and never commit it to version control!\n');
