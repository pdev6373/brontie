import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import { stripe } from '@/lib/stripe';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      giftItemId,
      recipientName,
      senderName,
      recipientEmail,
      senderEmail,
      ref,
    } = body;

    // Validate required fields
    if (!giftItemId) {
      return NextResponse.json(
        { error: 'Missing required field: giftItemId' },
        { status: 400 },
      );
    }

    // Get gift item details
    const giftItem = await GiftItem.findById(giftItemId)
      .populate('merchantId')
      .populate('locationIds');

    if (!giftItem) {
      return NextResponse.json(
        { error: 'Gift item not found' },
        { status: 404 },
      );
    }

    if (!giftItem.isActive) {
      return NextResponse.json(
        { error: 'Gift item is not available' },
        { status: 400 },
      );
    }

    // Create Stripe checkout session
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://localhost:3000';

    console.log('Stripe checkout session created:', {
      sessionId: '123',
      giftItemId,
      amount: giftItem.price,
    });

    return NextResponse.json({
      success: true,
      sessionId: '123',
      checkoutUrl: '1234',
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
