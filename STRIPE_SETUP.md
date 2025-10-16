# Stripe Integration Setup

## Environment Variables

To enable Stripe functionality, add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your Stripe webhook secret

# Optional: Base URL for production
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Development vs Production Mode

The application automatically detects whether Stripe is configured:

- **Development Mode**: If Stripe keys are missing, vouchers are created directly without payment
- **Production Mode**: If Stripe keys are present, users are redirected to Stripe checkout

## Stripe Webhook Setup

1. In your Stripe Dashboard, go to Webhooks
2. Add a new webhook endpoint: `https://yourdomain.com/api/webhook/stripe`
3. Select the following events:
   - `checkout.session.completed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

## Testing

### Development Mode (No Stripe)
1. Remove or comment out Stripe environment variables
2. Run `npm run dev`
3. Create a voucher - it will be created directly without payment

### Production Mode (With Stripe)
1. Add Stripe environment variables
2. Run `npm run dev`
3. Create a voucher - you'll be redirected to Stripe checkout

## Webhook Testing

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
# Forward events to your local webhook
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Trigger a test event
stripe trigger checkout.session.completed
```

## Currency

The current implementation uses EUR. To change the currency, update the `currency` field in `/src/app/api/checkout/route.ts`.
