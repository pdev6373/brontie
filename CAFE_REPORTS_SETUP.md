# Café Weekly Reports System

This system automatically generates and emails PDF reports to all active cafés every Wednesday (2 days before Friday payouts).

## Features

- **Automated PDF Generation**: Creates professional PDF reports using jsPDF
- **Email Delivery**: Sends reports via email with PDF attachment
- **Comprehensive Data**: Includes revenue, payouts, active vouchers, top sellers, etc.
- **Weekly Automation**: Runs every Wednesday via cron job
- **Manual Testing**: Admin interface for testing individual reports

## What's Included in Each Report

### Financial Summary
- Total Revenue from Brontie
- Total Payout from Brontie (all time)
- Payout This Period

### Voucher Activity
- Active Vouchers count
- Redeemed Vouchers (this period)

### Business Insights
- Top Selling Items (last 2 weeks)
- Payout Schedule (current and next payout dates)
- Link to manage products

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Email configuration (already exists)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin API token for report endpoints
ADMIN_API_TOKEN=your-secure-admin-token

# Base URL for links in emails
NEXT_PUBLIC_BASE_URL=https://brontie.com
```

### 2. Install Dependencies

The required packages are already installed:
- `jspdf` - PDF generation
- `html2canvas` - HTML to canvas conversion (if needed)
- `@types/jspdf` - TypeScript definitions

### 3. Set Up Automated Scheduling

#### Option A: Vercel Cron Jobs (Recommended)

The system is already configured to use Vercel Cron Jobs. Just add these environment variables:

```bash
# In Vercel Dashboard > Settings > Environment Variables
CRON_SECRET=your-secure-cron-secret-key
```

The cron job is configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-weekly-reports",
      "schedule": "0 9 * * 3"
    }
  ]
}
```

This runs every Wednesday at 9 AM UTC automatically.

#### Option B: Traditional Cron Job

If using a traditional server, add this to your crontab:

```bash
0 9 * * 3 cd /path/to/brontie-mvp && node scripts/send-weekly-reports.js
```

#### Option C: Other Services
- **GitHub Actions** (schedule workflow)
- **AWS Lambda** with EventBridge
- **Google Cloud Functions** with Cloud Scheduler

### 4. Manual Testing

Access the admin interface at: `/admin/reports`

Features:
- Test single merchant report
- Send reports to all merchants
- View results and errors

## API Endpoints

### Generate Single Report
```bash
POST /api/cafes/reports/generate
Authorization: Bearer {ADMIN_API_TOKEN}
Content-Type: application/json

{
  "merchantId": "merchant_id_here"
}
```

### Send All Reports
```bash
POST /api/admin/reports/send-all
Authorization: Bearer {ADMIN_API_TOKEN}
Content-Type: application/json

{}
```

### Test Report
```bash
POST /api/admin/reports/test
Authorization: Bearer {ADMIN_API_TOKEN}
Content-Type: application/json

{
  "merchantId": "merchant_id_here",
  "testEmail": "test@example.com" // optional
}
```

## File Structure

```
src/
├── lib/
│   └── pdf-report-generator.ts    # PDF generation logic
├── app/
│   ├── api/
│   │   ├── cafes/reports/generate/route.ts
│   │   └── admin/reports/
│   │       ├── send-all/route.ts
│   │       └── test/route.ts
│   └── admin/reports/page.tsx     # Admin interface
└── scripts/
    └── send-weekly-reports.js     # Cron job script
```

## How It Works

1. **Data Collection**: Queries MongoDB for merchant data, vouchers, transactions
2. **PDF Generation**: Creates professional PDF with charts and metrics
3. **Email Sending**: Sends HTML email with PDF attachment
4. **Error Handling**: Logs failures but continues with other merchants

## Important Notes

- Reports are sent to **all active merchants** regardless of sales activity
- The system handles merchants with **no sales or redemptions** gracefully
- Failed email sends are logged but don't stop the process
- Reports include links to manage products in the café dashboard

## Troubleshooting

### Common Issues

1. **PDF Generation Fails**
   - Check MongoDB connection
   - Verify merchant exists and is active
   - Check console logs for specific errors

2. **Email Sending Fails**
   - Verify SMTP credentials
   - Check email service limits
   - Ensure recipient email is valid

3. **Cron Job Not Running**
   - **Vercel**: Check Vercel dashboard for cron job logs
   - **Traditional**: Verify cron syntax and file permissions
   - Test script manually first

### Testing

#### Test Vercel Cron Job Manually

You can test the cron endpoint directly:

```bash
curl -X GET "https://your-domain.vercel.app/api/cron/send-weekly-reports" \
  -H "Authorization: Bearer your-cron-secret"
```

#### Test Individual Reports

1. Use the admin interface at `/admin/reports`
2. Test with a single merchant first
3. Check email delivery and PDF content
4. Verify all data is accurate

#### Monitor Vercel Cron Logs

1. Go to Vercel Dashboard > Functions
2. Click on your project
3. Go to "Functions" tab
4. Look for `/api/cron/send-weekly-reports`
5. Check execution logs and timing

## Customization

### Adding New Metrics

Edit `src/lib/pdf-report-generator.ts`:
1. Add new data queries in `generateCafeReport()`
2. Update `ReportData` interface
3. Add new sections in `PDFReportGenerator`

### Modifying Email Template

Edit the email HTML in the API routes:
- `src/app/api/cafes/reports/generate/route.ts`
- `src/app/api/admin/reports/send-all/route.ts`

### Changing Schedule

Update the cron expression:
- `0 9 * * 3` = Every Wednesday at 9 AM
- `0 8 * * 3` = Every Wednesday at 8 AM
- `0 10 * * 3` = Every Wednesday at 10 AM

## Support

For issues or questions:
- Check console logs for errors
- Test individual components
- Contact hello@brontie.com for assistance
