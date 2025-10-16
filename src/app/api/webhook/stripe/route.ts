import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import GiftItem from '@/models/GiftItem';
import Transaction from '@/models/Transaction';
import Merchant from '@/models/Merchant';
import { nanoid } from 'nanoid';
import Stripe from 'stripe';
import { sendPaymentSuccessEmail } from '@/lib/email';
import { getStripeFee } from '@/lib/stripe-fees';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }
  
  let event: Stripe.Event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    case 'charge.dispute.created':
    case 'charge.dispute.updated':
    case 'charge.dispute.closed':
      await handleChargeDispute(event.data.object as Stripe.Dispute);
      break;
    case 'account.updated':
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    // Connect to the gift database
    await connectToDatabase();
    
    const { 
      giftItemId, 
      recipientName, 
      senderName, 
      customerEmail: metadataEmail,
      recipientToken,
      productSku,
      merchantId,
      refToken,
      recipientEmail,
      senderEmail
    } = session.metadata || {};
    
    if (!giftItemId) {
      console.error('Missing giftItemId in session metadata');
      return;
    }
    
    console.log('Processing checkout completion for giftItemId:', giftItemId);
    
    // Get gift item details - avoid populate to prevent schema issues
    const giftItem = await GiftItem.findById(giftItemId);
    if (!giftItem) {
      console.error('Gift item not found:', giftItemId);
      return;
    }
    
    // Get actual Stripe fee from balance transaction
    const amountTotal = (session.amount_total || 0) / 100;
    const actualStripeFee = await getStripeFee(
      session.payment_intent as string, 
      amountTotal
    );
    
    // Generate a unique redemption code
    const redemptionCode = nanoid(10);
    const redemptionLink = redemptionCode; // Store just the code, not full URL
    
    // Get customer email from session (prioritize customer_details over metadata)
    const customerEmail = session.customer_details?.email || metadataEmail;
    
    // First check if a pending voucher already exists (created by checkout success page)
    let voucher = await Voucher.findOne({ paymentIntentId: session.payment_intent });
    
    if (voucher) {
      // Update the existing voucher to confirmed status
      voucher.status = 'unredeemed';
      voucher.confirmedAt = new Date();
      if (customerEmail && !voucher.email) {
        voucher.email = customerEmail;
      }
    } else {
      // Create a new voucher in the gift database
      voucher = new Voucher({
        redemptionCode,
        giftItemId: giftItem._id,
        status: 'issued',
        issuedAt: new Date(),
        confirmedAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 years from now
        senderName: senderName || 'Anonymous',
        recipientName: recipientName || '',
        email: customerEmail, // Store customer email
        recipientEmail: recipientEmail || '',
        redemptionLink,
        validLocationIds: giftItem.locationIds, // Use locationIds directly as ObjectIds
        paymentIntentId: session.payment_intent,
        amount: (session.amount_total || 0) / 100, // Convert from cents
        amountGross: (session.amount_total || 0) / 100,
        stripeFee: actualStripeFee, // Use actual Stripe fee from balance transaction
        productSku: productSku || giftItem.name,
        recipientToken: recipientToken || '',
        recipientBecameSender: false,
        recipientLinkedSenderEmail: senderEmail || '',
      });
    }
    
    await voucher.save();
    
    // Process viral loop if ref token is provided
    console.log('Viral loop check:', { refToken, recipientToken, hasRefToken: !!refToken, hasRecipientToken: !!recipientToken });
    
    if (refToken && recipientToken) {
      try {
        // Find the original voucher with this recipient token
        const originalVoucher = await Voucher.findOne({ recipientToken: refToken });
        
        console.log('Viral loop - searching for original voucher with recipientToken:', refToken);
        console.log('Viral loop - original voucher found:', !!originalVoucher);
        
        if (originalVoucher) {
          // Mark the original recipient as having become a sender
          originalVoucher.recipientBecameSender = true;
          originalVoucher.recipientLinkedSenderEmail = senderEmail || customerEmail || '';
          await originalVoucher.save();
          
          console.log('✅ Viral loop tracked successfully:', {
            originalVoucherId: originalVoucher._id,
            newVoucherId: voucher._id,
            refToken,
            recipientToken,
            senderEmail: senderEmail || customerEmail
          });
        } else {
          console.log('❌ Viral loop - original voucher NOT found for refToken:', refToken);
        }
      } catch (viralError) {
        console.error('Error processing viral loop:', viralError);
        // Don't throw error to avoid webhook failure
      }
    } else {
      console.log('⚠️ Viral loop - tokens missing. refToken:', refToken || 'MISSING', 'recipientToken:', recipientToken || 'MISSING');
    }
    
    console.log('Voucher created successfully:', {
      voucherId: voucher._id,
      redemptionLink: voucher.redemptionLink,
      giftItemId,
      paymentIntent: session.payment_intent,
      customerEmail,
      recipientToken,
      refToken
    });

    // Note: Purchase transaction will be created when voucher is redeemed
    
    // Send payment success email if customer email is available
    if (customerEmail) {
      try {
        // Populate the voucher with gift item details for email
        const populatedVoucher = await Voucher.findById(voucher._id).populate({
          path: 'giftItemId',
          populate: {
            path: 'merchantId',
            select: 'name'
          }
        });
        
        if (populatedVoucher) {
          const emailSent = await sendPaymentSuccessEmail(customerEmail, {
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
            console.log('Payment success email sent to:', customerEmail);
          } else {
            console.error('Failed to send payment success email to:', customerEmail);
          }
        }
      } catch (emailError) {
        console.error('Error sending payment success email:', emailError);
        // Don't throw the error to avoid webhook failure
      }
    } else {
      console.log('No customer email available, skipping payment success email');
    }
    
  } catch (error) {
    console.error('Error handling checkout completion:', error);
    throw error; // Re-throw to ensure webhook retry if needed
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  try {
    // Connect to the gift database
    await connectToDatabase();
    
    // Check if this is a full refund
    const isFullRefund = charge.amount_refunded === charge.amount;
    
    if (!isFullRefund) {
      console.log('Partial refund detected, not invalidating voucher');
      return;
    }
    
    // Find the payment intent ID
    const paymentIntentId = charge.payment_intent;
    
    if (!paymentIntentId) {
      console.error('Missing payment intent ID in charge object');
      return;
    }
    
    console.log('Processing refund for payment intent:', paymentIntentId);
    
    // Find the voucher associated with this payment
    const voucher = await Voucher.findOne({ paymentIntentId });
    
    if (!voucher) {
      console.error('No voucher found for payment intent:', paymentIntentId);
      return;
    }
    
    // Check if the voucher has already been redeemed
    if (voucher.status === 'redeemed') {
      console.error('Cannot refund a redeemed voucher:', voucher._id);
      // Note: You might want to implement a different business logic here
      // For example, create a record of the attempted refund but don't invalidate
      return;
    }
    
    // Update the voucher status to refunded
    voucher.status = 'refunded';
    voucher.refundedAt = new Date();
    await voucher.save();

    // Create refund transaction
    await createRefundTransaction(voucher, charge);
    
    console.log('Voucher invalidated due to refund:', {
      voucherId: voucher._id,
      redemptionLink: voucher.redemptionLink,
      paymentIntentId
    });
    
  } catch (error) {
    console.error('Error handling charge refunded:', error);
    throw error; // Re-throw to ensure webhook retry if needed
  }
}


// Function to create refund transaction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createRefundTransaction(voucher: any, charge: Stripe.Charge) {
  try {
    // Get gift item details
    const giftItem = await GiftItem.findById(voucher.giftItemId).populate('merchantId');
    if (!giftItem || !giftItem.merchantId) {
      console.error('Gift item or merchant not found for refund transaction');
      return;
    }

    const amount = (charge.amount_refunded || 0) / 100; // Convert from cents

    // Create refund transaction record
    const transaction = new Transaction({
      voucherId: voucher._id,
      merchantId: giftItem.merchantId._id,
      giftItemId: giftItem._id,
      type: 'refund',
      amount: amount,
      status: 'completed',
      customerEmail: voucher.email,
      senderName: voucher.senderName,
      recipientName: voucher.recipientName,
      stripePaymentIntentId: charge.payment_intent,
      completedAt: new Date()
    });

    await transaction.save();

    console.log('Refund transaction created:', {
      transactionId: transaction._id,
      voucherId: voucher._id,
      merchantId: giftItem.merchantId._id,
      amount: amount,
      chargeId: charge.id
    });

  } catch (error) {
    console.error('Error creating refund transaction:', error);
    // Don't throw error to avoid webhook failure
  }
}

async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    // Connect to the gift database
    await connectToDatabase();
    
    console.log('Processing dispute for charge:', dispute.charge);
    
    // Find the payment intent ID from the charge
    const charge = await stripe.charges.retrieve(dispute.charge as string);
    const paymentIntentId = charge.payment_intent;
    
    if (!paymentIntentId) {
      console.error('Missing payment intent ID in charge object');
      return;
    }
    
    console.log('Processing dispute for payment intent:', paymentIntentId);
    
    // Find the voucher associated with this payment
    const voucher = await Voucher.findOne({ paymentIntentId });
    
    if (!voucher) {
      console.error('No voucher found for payment intent:', paymentIntentId);
      return;
    }
    
    // Update the voucher status to disputed
    voucher.status = 'disputed';
    await voucher.save();
    
    // Create dispute transaction record
    await createDisputeTransaction(voucher, dispute, charge);
    
    console.log('Voucher marked as disputed:', {
      voucherId: voucher._id,
      redemptionLink: voucher.redemptionLink,
      paymentIntentId,
      disputeId: dispute.id,
      disputeReason: dispute.reason
    });
    
  } catch (error) {
    console.error('Error handling charge dispute:', error);
    throw error; // Re-throw to ensure webhook retry if needed
  }
}

// Function to create dispute transaction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createDisputeTransaction(voucher: any, dispute: Stripe.Dispute, charge: Stripe.Charge) {
  try {
    // Get gift item details
    const giftItem = await GiftItem.findById(voucher.giftItemId).populate('merchantId');
    if (!giftItem || !giftItem.merchantId) {
      console.error('Gift item or merchant not found for dispute transaction');
      return;
    }

    const amount = (charge.amount || 0) / 100; // Convert from cents

    // Create dispute transaction record
    const transaction = new Transaction({
      voucherId: voucher._id,
      merchantId: giftItem.merchantId._id,
      giftItemId: giftItem._id,
      type: 'purchase', // Keep as purchase type but with dispute status
      amount: amount,
      status: 'failed', // Mark as failed due to dispute
      customerEmail: voucher.email,
      senderName: voucher.senderName,
      recipientName: voucher.recipientName,
      stripePaymentIntentId: charge.payment_intent,
      completedAt: new Date()
    });

    await transaction.save();

    console.log('Dispute transaction created:', {
      transactionId: transaction._id,
      voucherId: voucher._id,
      merchantId: giftItem.merchantId._id,
      amount: amount,
      disputeId: dispute.id,
      disputeReason: dispute.reason
    });

  } catch (error) {
    console.error('Error creating dispute transaction:', error);
    // Don't throw error to avoid webhook failure
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    await connectToDatabase();
    
    console.log('Stripe Connect account updated:', {
      accountId: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
    
    // Find merchant with this Stripe account ID
    const merchant = await Merchant.findOne({ 'stripeConnectSettings.accountId': account.id });
    
    if (!merchant) {
      console.log('Merchant not found for Stripe account:', account.id);
      return;
    }
    
    // Update merchant's Stripe Connect settings
    merchant.stripeConnectSettings = {
      accountId: account.id,
      isConnected: account.details_submitted && account.charges_enabled,
      onboardingCompleted: account.details_submitted || false,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
    };
    
    await merchant.save();
    
    console.log('✅ Merchant Stripe Connect settings updated:', {
      merchantId: merchant._id,
      merchantName: merchant.name,
      isConnected: merchant.stripeConnectSettings.isConnected,
      onboardingCompleted: merchant.stripeConnectSettings.onboardingCompleted
    });
    
  } catch (error) {
    console.error('Error updating merchant Stripe Connect settings:', error);
    // Don't throw error to avoid webhook failure
  }
}
