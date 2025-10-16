#!/usr/bin/env node

/**
 * Test Vercel Cron Job Script
 * 
 * This script tests the Vercel cron job endpoint to ensure it's working correctly.
 * 
 * Usage: node scripts/test-cron.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.com';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('❌ Error: CRON_SECRET environment variable is required');
  console.log('💡 Set it with: CRON_SECRET=your-secret-key node scripts/test-cron.js');
  process.exit(1);
}

async function testCronJob() {
  const startTime = new Date();
  console.log(`🧪 Testing Vercel Cron Job at ${startTime.toISOString()}`);
  console.log(`📡 Endpoint: ${BASE_URL}/api/cron/send-weekly-reports`);

  try {
    const url = new URL('/api/cron/send-weekly-reports', BASE_URL);
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'User-Agent': 'Brontie-Cron-Test/1.0'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const request = client.request(url, options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        const endTime = new Date();
        const duration = endTime - startTime;
        
        console.log(`\n📊 Response Status: ${response.statusCode}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        
        try {
          const result = JSON.parse(data);
          
          if (response.statusCode === 200 && result.success) {
            console.log(`\n✅ Cron job executed successfully!`);
            console.log(`📈 Results:`);
            console.log(`   Total merchants: ${result.results.total}`);
            console.log(`   Successful: ${result.results.successful}`);
            console.log(`   Failed: ${result.results.failed}`);
            console.log(`   Start time: ${result.results.startTime}`);
            console.log(`   End time: ${result.results.endTime}`);
            console.log(`   Duration: ${result.results.duration}`);
            
            if (result.results.errors.length > 0) {
              console.log(`\n❌ Errors:`);
              result.results.errors.forEach(error => {
                console.log(`   - ${error}`);
              });
            }
            
            console.log(`\n🎉 Test completed successfully!`);
          } else {
            console.error(`\n❌ Cron job failed:`, result.error || result.message);
            if (result.details) {
              console.error(`   Details: ${result.details}`);
            }
            process.exit(1);
          }
        } catch (parseError) {
          console.error(`\n❌ Failed to parse response:`, parseError.message);
          console.error(`📄 Raw response:`, data);
          process.exit(1);
        }
      });
    });

    request.on('error', (error) => {
      console.error(`\n❌ Request failed:`, error.message);
      process.exit(1);
    });

    request.on('timeout', () => {
      console.error(`\n⏰ Request timeout`);
      request.destroy();
      process.exit(1);
    });

    // Set timeout to 5 minutes (cron jobs can take time)
    request.setTimeout(300000);

    request.end();

  } catch (error) {
    console.error(`\n❌ Unexpected error:`, error.message);
    process.exit(1);
  }
}

// Check if this is being run directly
if (require.main === module) {
  testCronJob();
}

module.exports = { testCronJob };
