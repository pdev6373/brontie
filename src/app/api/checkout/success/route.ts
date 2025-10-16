import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import GiftItem from '@/models/GiftItem';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import MerchantLocation from '@/models/MerchantLocation';
// eslint-disable-next-line @typescript-eslint/no-unused-vars  
import Merchant from '@/models/Merchant';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Category from '@/models/Category';
import { stripe } from '@/lib/stripe';
import { nanoid } from 'nanoid';
import { sendPaymentSuccessEmail } from '@/lib/email';
import { Document } from 'mongoose';

// Function to wait for voucher with retry logic
async function waitForVoucherWithRetry(paymentIntentId: string, maxAttempts: number = 5) {
  // Use progressive delays: 1s, 2s, 3s, etc.
  let attempts = 0;

  console.log(`[waitForVoucherWithRetry] Starting to look for voucher with paymentIntentId: ${paymentIntentId}`);

  while (attempts < maxAttempts) {
    try {
      const voucher = await Voucher.findOne({ paymentIntentId });
      if (voucher) {
        console.log(`[waitForVoucherWithRetry] Voucher found on attempt ${attempts + 1}`);
        return voucher;
      }
    } catch (error) {
      console.error(`[waitForVoucherWithRetry] Error on attempt ${attempts + 1}:`, error);
    }

    attempts++;
    if (attempts < maxAttempts) {
      const delay = attempts * 1000; // Progressive delay: 1s, 2s, 3s, etc.
      console.log(`[waitForVoucherWithRetry] Voucher not found, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log(`[waitForVoucherWithRetry] Voucher not found after ${maxAttempts} attempts`);
  return null;
}

// Function to send payment success email
async function sendPaymentSuccessEmailIfNeeded(voucher: Document & { _id: string; email?: string; [key: string]: unknown }, customerEmail?: string) {
  try {
    // Use customer email from voucher if available, otherwise use provided email
    const emailToUse = voucher.email || customerEmail;
    
    if (!emailToUse) {
      console.log('No email available for payment success email');
      return;
    }

    // Populate voucher with gift item details for email
    const populatedVoucher = await Voucher.findById(voucher._id).populate({
      path: 'giftItemId',
      populate: {
        path: 'merchantId',
        select: 'name'
      }
    });

    if (populatedVoucher) {
      const emailSent = await sendPaymentSuccessEmail(emailToUse, {
        giftItemId: {
          name: populatedVoucher.giftItemId.name,
          price: populatedVoucher.giftItemId.price,
          merchantId: {
            name: populatedVoucher.giftItemId.merchantId.name
          }
        },
        senderName: populatedVoucher.senderName || 'Anonymous',
        recipientName: populatedVoucher.recipientName || '',
        redemptionLink: populatedVoucher.redemptionLink,
        status: populatedVoucher.status
      });

      if (emailSent) {
        console.log('Payment success email sent to:', emailToUse);
      } else {
        console.error('Failed to send payment success email to:', emailToUse);
      }
    }
  } catch (emailError) {
    console.error('Error sending payment success email:', emailError);
    // Don't throw the error to avoid API failure
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const voucherId = searchParams.get('voucher_id');
    const sessionId = searchParams.get('session_id');
    
    console.log(`[Checkout Success] Processing request with voucherId: ${voucherId}, sessionId: ${sessionId}`);
    
    await connectToDatabase();
    
    // For development mode, use voucher_id directly
    if (voucherId) {
      console.log(`[Checkout Success] Development mode - finding voucher by ID: ${voucherId}`);
      // Find the voucher by ID directly
      const voucher = await Voucher.findById(voucherId)
        .populate({
          path: 'giftItemId',
          populate: {
            path: 'merchantId',
            select: 'name'
          }
        });
      
      if (!voucher) {
        console.error(`[Checkout Success] Voucher not found for ID: ${voucherId}`);
        return NextResponse.json(
          { error: 'Voucher not found' },
          { status: 404 }
        );
      }
      
      // Send payment success email for development mode
      await sendPaymentSuccessEmailIfNeeded(voucher);
      
      return NextResponse.json({
        success: true,
        voucher
      });
    }
    
    // For production mode, use session_id to find voucher
    if (sessionId) {
      console.log(`[Checkout Success] Production mode - processing session: ${sessionId}`);
      
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('[Checkout Success] Stripe secret key not configured');
        return NextResponse.json(
          { error: 'Stripe not configured' },
          { status: 501 }
        );
      }

      try {
        // Get Stripe session details
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log('[Checkout Success] Stripe session retrieved:', {
          sessionId,
          customerEmail: session.customer_details?.email,
          metadata: session.metadata
        });

        if (!session) {
          console.error('[Checkout Success] No Stripe session found for sessionId:', sessionId);
          return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
        }

        // Get customer email from Stripe session
        const customerEmail = session.customer_details?.email;
        if (!customerEmail) {
          console.error('[Checkout Success] No customer email found in Stripe session');
          return NextResponse.json({ 
            error: 'No customer email found in checkout session',
            details: 'Please ensure you provided an email during checkout'
          }, { status: 400 });
        }

        // Check if voucher already exists for this session
        let voucher = await Voucher.findOne({ 
          'stripeSessionId': sessionId 
        }).populate('giftItemId').populate('giftItemId.merchantId');

        if (voucher) {
          console.log('[Checkout Success] Voucher already exists:', voucher._id);
          
          // Send email if not already sent
          if (!voucher.emailSent) {
            try {
              await sendPaymentSuccessEmailIfNeeded(voucher, customerEmail);
              voucher.emailSent = true;
              await voucher.save();
              console.log('[Checkout Success] Payment success email sent to existing voucher');
            } catch (emailError) {
              console.error('[Checkout Success] Error sending email to existing voucher:', emailError);
            }
          }
          
          return NextResponse.json({ voucher });
        }

        // Try to find existing voucher with retry logic (webhook might still be processing)
        // Use 5 attempts with progressive delays for better reliability
        voucher = await waitForVoucherWithRetry(session.payment_intent as string, 5);

        // If voucher not found, create it atomically to prevent race conditions
        if (!voucher) {
          console.log('[Checkout Success] Voucher not found, creating from session data (webhook may not have processed yet)');
          
          const { giftItemId, recipientName, senderName } = session.metadata || {};
          
          if (!giftItemId) {
            console.error('[Checkout Success] Missing gift item information in session metadata:', session.metadata);
            
            // Check if this is an old test session without metadata
            if (sessionId.startsWith('cs_test_')) {
              return NextResponse.json({
                error: 'Test session missing metadata',
                details: 'This test session was created without the required gift item information. Please create a new test purchase through the application.',
                suggestion: 'Go to the homepage, select a gift item, and complete a new test purchase.',
                sessionId: sessionId,
                metadata: session.metadata
              }, { status: 400 });
            }
            
            return NextResponse.json(
              { error: 'Missing gift item information in session' },
              { status: 400 }
            );
          }

          // Get gift item details
          console.log(`[Checkout Success] Finding gift item: ${giftItemId}`);
          const giftItem = await GiftItem.findById(giftItemId);
          if (!giftItem) {
            console.error(`[Checkout Success] Gift item not found: ${giftItemId}`);
            return NextResponse.json(
              { error: 'Gift item not found' },
              { status: 404 }
            );
          }

          // Generate a unique redemption code
          const redemptionCode = nanoid(10);
          const redemptionLink = redemptionCode;

          // Use atomic findOneAndUpdate with upsert to prevent duplicates
          try {
            console.log(`[Checkout Success] Creating voucher for payment intent: ${session.payment_intent}`);
            voucher = await Voucher.findOneAndUpdate(
              { paymentIntentId: session.payment_intent }, // Search criteria
              {
                $setOnInsert: {
                  redemptionCode,
                  giftItemId: giftItem._id,
                  status: 'pending', // Set as pending until webhook confirms it
                  expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years from now
                  senderName: senderName || 'Anonymous',
                  recipientName: recipientName || '',
                  email: customerEmail, // Store customer email
                  redemptionLink,
                  validLocationIds: giftItem.locationIds, // Use locationIds directly as ObjectIds
                  paymentIntentId: session.payment_intent,
                  amount: (session.amount_total || 0) / 100,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              },
              { 
                upsert: true, // Create if not found
                new: true,    // Return the document after update
                runValidators: true
              }
            );

            console.log('[Checkout Success] Voucher created/found atomically:', {
              voucherId: voucher._id,
              sessionId,
              paymentIntent: session.payment_intent,
              customerEmail
            });
          } catch (duplicateError) {
            // If there's still a duplicate key error, just find the existing voucher
            console.log('[Checkout Success] Duplicate detected, finding existing voucher:', duplicateError instanceof Error ? duplicateError.message : 'Unknown error');
            voucher = await Voucher.findOne({ 
              paymentIntentId: session.payment_intent 
            });
          }

          // Populate the voucher for response
          if (voucher) {
            voucher = await Voucher.findById(voucher._id).populate({
              path: 'giftItemId',
              populate: {
                path: 'merchantId',
                select: 'name'
              }
            });
          }
        }

        if (!voucher) {
          console.error('[Checkout Success] Failed to create or find voucher after all attempts');
          return NextResponse.json(
            { error: 'Failed to create or find voucher' },
            { status: 500 }
          );
        }

        // Send payment success email
        await sendPaymentSuccessEmailIfNeeded(voucher, customerEmail || undefined);

        console.log('[Checkout Success] Success response prepared');
        return NextResponse.json({
          success: true,
          voucher
        });
      } catch (stripeError) {
        console.error('[Checkout Success] Stripe API error:', stripeError);
        return NextResponse.json(
          { error: 'Failed to retrieve payment session' },
          { status: 500 }
        );
      }
    }

    console.error('[Checkout Success] Missing required parameters');
    return NextResponse.json(
      { error: 'Missing voucher_id or session_id parameter' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[Checkout Success] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
