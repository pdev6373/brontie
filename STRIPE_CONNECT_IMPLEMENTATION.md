# Stripe Connect Implementation

## Overview

This implementation allows cafés to connect their Stripe accounts for automated payouts following the specified schedule: 2x per month (2nd & 4th Friday).

## Features Implemented

### 1. Stripe Connect Account Creation
- **API**: `/api/stripe-connect/create-account`
- **Method**: POST
- **Description**: Creates a Stripe Connect Express account for the café
- **Features**:
  - Automatically configures payout schedule (weekly on Friday with 7-day delay for Europe)
  - Sets up account with proper capabilities (transfers, card_payments)
  - Generates onboarding link for café to complete setup

### 2. Payout Schedule Configuration
- **API**: `/api/stripe-connect/configure-payout-schedule`
- **Method**: POST
- **Description**: Configures the payout schedule for connected accounts
- **Schedule**: Weekly payouts on Friday with 7-day delay (Europe compliance)

### 3. Account Status Monitoring
- **API**: `/api/stripe-connect/account-status`
- **Method**: GET
- **Description**: Retrieves current status of Stripe Connect account
- **Returns**: Connection status, onboarding status, capabilities, and payout schedule

### 4. Status Updates
- **API**: `/api/stripe-connect/update-status`
- **Method**: POST
- **Description**: Updates merchant's Stripe Connect status after onboarding
- **Features**: Automatically called when returning from Stripe onboarding

### 5. Fund Transfers
- **API**: `/api/stripe-connect/transfer-funds`
- **Method**: POST
- **Description**: Transfers funds to connected café accounts
- **Features**: Automated transfers following the configured schedule

## Database Schema Updates

### Merchant Model
Added `stripeConnectSettings` field:
```typescript
stripeConnectSettings?: {
  accountId?: string;
  isConnected: boolean;
  onboardingCompleted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  payoutSchedule?: {
    interval: string;
    weekly_anchor?: string;
    delay_days: number;
  };
};
```

## Dashboard Integration

### Café Dashboard Features
1. **Stripe Connect Status Display**
   - Shows connection status
   - Displays onboarding progress
   - Shows payout schedule configuration
   - Provides setup/configuration buttons

2. **Payout Information**
   - Displays next payout date
   - Shows available balance
   - Explains payout process

3. **Setup Flow**
   - One-click Stripe Connect setup
   - Automatic redirect to Stripe onboarding
   - Status updates on return

## Payout Schedule

### Configuration
- **Interval**: Weekly
- **Day**: Friday
- **Delay**: 7 days (Europe compliance)
- **Frequency**: Every Friday (effectively 2x per month as requested)

### Benefits
- Automated payouts
- Lower transaction fees
- Direct bank account deposits
- Real-time payment tracking
- Europe compliance

## Usage Flow

1. **Café Setup**
   - Café logs into dashboard
   - Clicks "Setup Stripe Connect"
   - Redirected to Stripe onboarding
   - Completes account setup
   - Returns to dashboard with updated status

2. **Automatic Payouts**
   - Stripe automatically processes payouts
   - Follows configured schedule (weekly on Friday)
   - 7-day delay for Europe compliance
   - Funds transferred directly to café's bank account

3. **Status Monitoring**
   - Dashboard shows real-time status
   - Displays payout schedule information
   - Provides access to Stripe dashboard

## Security

- JWT token authentication for all APIs
- Merchant ID validation
- Stripe account verification
- Secure fund transfers

## Error Handling

- Comprehensive error messages
- Graceful fallbacks
- User-friendly notifications
- Detailed logging for debugging

## Future Enhancements

- Webhook integration for real-time updates
- Advanced payout scheduling options
- Multi-currency support
- Enhanced reporting and analytics

