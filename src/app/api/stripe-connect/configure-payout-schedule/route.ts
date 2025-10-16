import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import { stripe } from '@/lib/stripe';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cafe-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    await connectToDatabase();
    const merchant = await Merchant.findById(merchantId);

    if (!merchant || !merchant.stripeConnectSettings?.accountId) {
      return NextResponse.json({ error: 'Merchant or Stripe Connect account not found' }, { status: 404 });
    }

    const accountId = merchant.stripeConnectSettings.accountId;

    await stripe.accounts.update(accountId, {
      settings: {
        payouts: {
          schedule: {
            interval: 'weekly',
            weekly_anchor: 'friday',
            delay_days: 7, // 7 days delay for Europe
          },
        },
      },
    });

    // Update merchant's local record
    merchant.stripeConnectSettings.payoutSchedule = {
      interval: 'weekly',
      weekly_anchor: 'friday',
      delay_days: 7,
    };
    await merchant.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error configuring Stripe Connect payout schedule:', error);
    return NextResponse.json(
      { error: 'Failed to configure payout schedule', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
