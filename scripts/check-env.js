#!/usr/bin/env node

/**
 * Environment Variables Checker
 * 
 * This script checks if all required environment variables are set
 * for the café reports system to work properly.
 */

const requiredVars = {
  // Database
  'MONGODB_URI': 'MongoDB connection string',
  
  // Authentication
  'JWT_SECRET': 'JWT secret for authentication',
  
  // Email
  'SMTP_USER': 'Gmail SMTP username',
  'SMTP_PASS': 'Gmail SMTP password',
  
  // Cron Jobs
  'CRON_SECRET': 'Vercel cron job security token',
  
  // Admin API
  'ADMIN_API_TOKEN': 'Admin API security token',
  'NEXT_PUBLIC_ADMIN_API_TOKEN': 'Public admin API token',
  
  // Base URL
  'NEXT_PUBLIC_BASE_URL': 'Application base URL'
};

const importantVars = {
  'ADMIN_EMAIL': 'Admin email for notifications',
  'STRIPE_SECRET_KEY': 'Stripe secret key',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'Stripe publishable key',
  'QR_ENCRYPTION_KEY': 'QR code encryption key'
};

const optionalVars = {
  'STRIPE_WEBHOOK_SECRET': 'Stripe webhook secret',
  'NEXT_PUBLIC_FATHOM_ID': 'Fathom analytics ID',
  'NEXT_PUBLIC_POSTHOG_KEY': 'PostHog analytics key',
  'NODE_ENV': 'Node environment'
};

console.log('🔍 Checking Environment Variables...\n');

let missingRequired = 0;
let missingImportant = 0;

// Check required variables
console.log('🔴 REQUIRED VARIABLES:');
Object.entries(requiredVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${key}: MISSING - ${description}`);
    missingRequired++;
  }
});

console.log('\n🟡 IMPORTANT VARIABLES:');
Object.entries(importantVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`⚠️  ${key}: MISSING - ${description}`);
    missingImportant++;
  }
});

console.log('\n🟢 OPTIONAL VARIABLES:');
Object.entries(optionalVars).forEach(([key, description]) => {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`⚪ ${key}: Not set - ${description}`);
  }
});

console.log('\n📊 SUMMARY:');
if (missingRequired === 0) {
  console.log('✅ All required variables are set!');
  console.log('🚀 The café reports system should work properly.');
} else {
  console.log(`❌ ${missingRequired} required variables are missing.`);
  console.log('🔧 Please add the missing variables to your .env file.');
}

if (missingImportant > 0) {
  console.log(`⚠️  ${missingImportant} important variables are missing.`);
  console.log('💡 Consider adding them for full functionality.');
}

console.log('\n📝 To add missing variables:');
console.log('1. Create/edit your .env file in the project root');
console.log('2. Add the missing variables with appropriate values');
console.log('3. Restart your application');

// Check specific combinations for café reports
console.log('\n☕ CAFÉ REPORTS SYSTEM CHECK:');
const reportsVars = ['MONGODB_URI', 'SMTP_USER', 'SMTP_PASS', 'CRON_SECRET', 'ADMIN_API_TOKEN'];
const reportsMissing = reportsVars.filter(key => !process.env[key]);

if (reportsMissing.length === 0) {
  console.log('✅ Café reports system is fully configured!');
  console.log('📧 Weekly reports will be sent automatically every Wednesday.');
} else {
  console.log('❌ Café reports system needs configuration:');
  reportsMissing.forEach(key => {
    console.log(`   - ${key}`);
  });
}
