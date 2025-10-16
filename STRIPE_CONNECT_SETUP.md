# Stripe Connect Setup Guide

## Overview
This guide explains how the automated Stripe Connect payout system works for café merchants in the Brontie platform.

## Features
✅ **Automated Weekly Payouts** - Cafés receive payments every week automatically  
✅ **No Manual Transfers** - Stripe handles all transfers to café bank accounts  
✅ **Lower Fees** - Stripe Connect has better rates than manual bank transfers  
✅ **Instant Setup** - Cafés can connect their Stripe account with one click  
✅ **Real-time Status** - Dashboard shows connection status and payout history  

## How It Works

### 1. Café Onboarding Flow

1. **Café clicks "Setup Stripe Connect"** button in dashboard
2. **API creates Stripe Express account** (`/api/stripe-connect/create-account`)
3. **Café is redirected to Stripe** for onboarding
4. **Café fills in business details** (bank account, tax info, etc.)
5. **Stripe webhook confirms completion** (`account.updated` event)
6. **Dashboard updates** to show "Connected" status

### 2. Weekly Payout Process

Every week (via cron job or manual trigger):

1. **System identifies eligible cafés** - Must have Stripe Connect enabled
2. **Calculates payout amount** for each café:
   - Finds all redeemed vouchers not yet paid out
   - Calculates: `Net Payout = Gross Revenue - Stripe Fees - Platform Fees`
3. **Creates Stripe transfer** - Automatically sends money to café's account
4. **Marks transactions as paid** - Updates database to prevent double-payment

### 3. Payout Calculation Example

```
Customer buys coffee gift: €12.00
├── Stripe Processing Fee: €0.53 (1.4% + €0.25)
├── Platform Fee (10%): €1.14 (10% of €11.47)
└── Café receives: €10.33

Automatic transfer to café's Stripe account
```

## API Endpoints

### 1. Create Stripe Connect Account
**POST** `/api/stripe-connect/create-account`

- Authenticated via café JWT token
- Creates Stripe Express account
- Returns onboarding URL
- Saves `accountId` to merchant document

### 2. Weekly Payouts (Cron Job)
**POST** `/api/stripe-connect/weekly-payouts`

- Requires `Authorization: Bearer CRON_SECRET`
- Processes all cafés with Stripe Connect
- Creates transfers for unpaid transactions
- Returns summary of payouts

**GET** `/api/stripe-connect/weekly-payouts`

- Check current payout status
- See unpaid amounts per café
- No auth required (for admin testing)

### 3. Stripe Webhook
**POST** `/api/webhook/stripe`

Handles events:
- `account.updated` - Updates café connection status when onboarding completes
- `checkout.session.completed` - Creates vouchers
- `charge.refunded` - Handles refunds
- `charge.dispute.created` - Records disputes

## Environment Variables

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Cron Secret (for weekly payouts)
CRON_SECRET=your-secret-key-here

# JWT Secret (for café authentication)
JWT_SECRET=your-jwt-secret
```

## Database Schema Updates

### Merchant Model
```typescript
stripeConnectSettings: {
  accountId: string;           // Stripe Connect account ID
  isConnected: boolean;        // true when onboarding complete
  onboardingCompleted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}
```

### Transaction Model
```typescript
stripePaidOut: boolean;        // true when paid via Stripe Connect
stripePaidOutAt: Date;         // timestamp of payout
stripeTransferId: string;      // Stripe transfer ID for reference
```

## Setting Up Cron Jobs

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/stripe-connect/weekly-payouts",
      "schedule": "0 0 * * 1"
    }
  ]
}
```

This runs every Monday at midnight UTC.

### Option 2: External Cron Service

Use services like:
- **cron-job.org** (free, reliable)
- **EasyCron** (free tier available)
- **AWS EventBridge** (for AWS deployments)

Configure to hit:
```
POST https://yourdomain.com/api/stripe-connect/weekly-payouts
Headers:
  Authorization: Bearer YOUR_CRON_SECRET
```

### Option 3: Manual Trigger

For testing or manual payouts:
```bash
curl -X POST https://yourdomain.com/api/stripe-connect/weekly-payouts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Stripe Dashboard Configuration

### 1. Enable Connect
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/connect/settings)
2. Enable **Connect** (Express accounts)
3. Set platform name: "Brontie"
4. Configure branding (logo, colors)

### 2. Configure Webhooks
1. Go to **Developers > Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhook/stripe`
3. Select events:
   - `account.updated`
   - `checkout.session.completed`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.updated`
   - `charge.dispute.closed`
4. Copy webhook secret to `.env`

### 3. Test Mode
- Use test keys during development
- Test Connect accounts can be created
- No real money is transferred
- Test bank account: `000123456789` (Stripe test number)

### 4. Go Live Checklist
- [ ] Submit business information to Stripe
- [ ] Complete Connect application
- [ ] Switch to live keys
- [ ] Configure live webhook endpoint
- [ ] Test with real café account
- [ ] Set up cron job
- [ ] Monitor first payout cycle

## Testing

### Test Stripe Connect Flow

1. **Create test café account**
```bash
# Login as café in dashboard
```

2. **Click "Setup Stripe Connect"**
- Use Stripe test data:
  - Phone: `000 000 0000`
  - DOB: `01/01/1901`
  - Address: Any test address
  - Bank: `000123456789` (routing: `110000000`)

3. **Complete onboarding**
- Return to dashboard
- Should show "Connected" status

4. **Create test transactions**
```bash
# Buy some coffee gifts
# Redeem vouchers
```

5. **Trigger test payout**
```bash
curl -X POST http://localhost:3000/api/stripe-connect/weekly-payouts \
  -H "Authorization: Bearer test-secret"
```

6. **Check Stripe Dashboard**
- Go to Connect > Transfers
- Should see transfer to café account

### Check Payout Status

```bash
curl http://localhost:3000/api/stripe-connect/weekly-payouts
```

Returns:
```json
{
  "success": true,
  "connectedMerchants": 2,
  "summary": [
    {
      "merchantName": "Test Café",
      "unpaidTransactions": 5,
      "unpaidAmount": 60.00
    }
  ]
}
```

## Troubleshooting

### Café shows "Not Connected" after onboarding
- Check webhook logs for `account.updated` event
- Verify webhook secret is correct
- Manually check account status in Stripe Dashboard
- Re-run onboarding if needed

### Payouts failing
- Check `stripeConnectSettings.payoutsEnabled` is true
- Verify minimum payout threshold (€5) is met
- Check Stripe Connect account is fully verified
- Review error logs in API response

### Duplicate transfers
- System checks `stripePaidOut` flag to prevent duplicates
- Each transaction only paid once
- `stripeTransferId` links to Stripe for reconciliation

## Security Best Practices

1. **Never expose Stripe secret keys** in client code
2. **Verify webhook signatures** (already implemented)
3. **Use HTTPS only** in production
4. **Rotate CRON_SECRET** periodically
5. **Monitor failed payouts** and alert admins
6. **Audit transfer logs** monthly

## Support

For issues or questions:
- **Stripe Support**: https://support.stripe.com
- **Stripe Connect Docs**: https://stripe.com/docs/connect
- **Platform Email**: support@brontie.com

## Future Enhancements

Potential improvements:
- [ ] Email notifications when payouts are sent
- [ ] Payout history page in café dashboard
- [ ] CSV export of transfers
- [ ] Instant payouts (1% fee, available immediately)
- [ ] Multi-currency support (GBP, USD)
- [ ] Automatic retry for failed transfers