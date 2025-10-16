#!/usr/bin/env node

/**
 * Weekly Report Sender Script
 * 
 * This script sends weekly reports to all active merchants every Wednesday.
 * It can be run manually or scheduled via cron job.
 * 
 * Usage:
 * - Manual: node scripts/send-weekly-reports.js
 * - Cron: 0 9 * * 3 node /path/to/scripts/send-weekly-reports.js
 *   (Runs every Wednesday at 9 AM)
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://brontie.com';
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

if (!ADMIN_API_TOKEN) {
  console.error('❌ Error: ADMIN_API_TOKEN environment variable is required');
  process.exit(1);
}

async function sendWeeklyReports() {
  const startTime = new Date();
  console.log(`🚀 Starting weekly report sending at ${startTime.toISOString()}`);
  console.log(`📧 Sending reports to all active merchants...`);

  try {
    const url = new URL('/api/admin/reports/send-all', BASE_URL);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_TOKEN}`
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
        
        try {
          const result = JSON.parse(data);
          
          if (response.statusCode === 200 && result.success) {
            console.log(`✅ Weekly reports sent successfully!`);
            console.log(`📊 Results:`);
            console.log(`   Total merchants: ${result.results.total}`);
            console.log(`   Successful: ${result.results.successful}`);
            console.log(`   Failed: ${result.results.failed}`);
            
            if (result.results.errors.length > 0) {
              console.log(`❌ Errors:`);
              result.results.errors.forEach(error => {
                console.log(`   - ${error}`);
              });
            }
            
            console.log(`⏱️  Duration: ${duration}ms`);
            console.log(`🕐 Completed at: ${endTime.toISOString()}`);
          } else {
            console.error(`❌ Failed to send reports:`, result.error || result.message);
            process.exit(1);
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse response:`, parseError.message);
          console.error(`📄 Raw response:`, data);
          process.exit(1);
        }
      });
    });

    request.on('error', (error) => {
      console.error(`❌ Request failed:`, error.message);
      process.exit(1);
    });

    request.write(JSON.stringify({}));
    request.end();

  } catch (error) {
    console.error(`❌ Unexpected error:`, error.message);
    process.exit(1);
  }
}

// Check if this is being run directly
if (require.main === module) {
  sendWeeklyReports();
}

module.exports = { sendWeeklyReports };
