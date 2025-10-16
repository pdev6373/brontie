import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import { stripe } from '@/lib/stripe';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { giftItemId, recipientName, senderName, recipientEmail, senderEmail, ref } = body;
    
    // Validate required fields
    if (!giftItemId) {
      return NextResponse.json(
        { error: 'Missing required field: giftItemId' },
        { status: 400 }
      );
    }
    
    // Get gift item details
    const giftItem = await GiftItem.findById(giftItemId)
      .populate('merchantId')
      .populate('locationIds');
    
    if (!giftItem) {
      return NextResponse.json(
        { error: 'Gift item not found' },
        { status: 404 }
      );
    }
    
    if (!giftItem.isActive) {
      return NextResponse.json(
        { error: 'Gift item is not available' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: giftItem.name,
              description: `Gift voucher for ${giftItem.merchantId.name}`,
              images: giftItem.imageUrl ? [giftItem.imageUrl] : [],
            },
            unit_amount: Math.round(giftItem.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/product/${giftItemId}`,
      metadata: {
        giftItemId: giftItemId,
        recipientName: recipientName || '',
        senderName: senderName || 'Anonymous',
        recipientEmail: recipientEmail || '',
        senderEmail: senderEmail || '',
        recipientToken: crypto.randomUUID(),
        productSku: giftItem.name,
        merchantId: giftItem.merchantId._id.toString(),
        refToken: ref || '',
      },
    });

    console.log('Stripe checkout session created:', {
      sessionId: session.id,
      giftItemId,
      amount: giftItem.price
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
