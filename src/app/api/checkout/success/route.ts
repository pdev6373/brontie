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
import { nanoid } from 'nanoid';
import { sendPaymentSuccessEmail } from '@/lib/email';
import { Document } from 'mongoose';

// Function to wait for voucher with retry logic
async function waitForVoucherWithRetry(
  paymentIntentId: string,
  maxAttempts: number = 5,
) {
  // Use progressive delays: 1s, 2s, 3s, etc.
  let attempts = 0;

  console.log(
    `[waitForVoucherWithRetry] Starting to look for voucher with paymentIntentId: ${paymentIntentId}`,
  );

  while (attempts < maxAttempts) {
    try {
      const voucher = await Voucher.findOne({ paymentIntentId });
      if (voucher) {
        console.log(
          `[waitForVoucherWithRetry] Voucher found on attempt ${attempts + 1}`,
        );
        return voucher;
      }
    } catch (error) {
      console.error(
        `[waitForVoucherWithRetry] Error on attempt ${attempts + 1}:`,
        error,
      );
    }

    attempts++;
    if (attempts < maxAttempts) {
      const delay = attempts * 1000; // Progressive delay: 1s, 2s, 3s, etc.
      console.log(
        `[waitForVoucherWithRetry] Voucher not found, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log(
    `[waitForVoucherWithRetry] Voucher not found after ${maxAttempts} attempts`,
  );
  return null;
}

// Function to send payment success email
async function sendPaymentSuccessEmailIfNeeded(
  voucher: Document & { _id: string; email?: string; [key: string]: unknown },
  customerEmail?: string,
) {
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
        select: 'name',
      },
    });

    if (populatedVoucher) {
      const emailSent = await sendPaymentSuccessEmail(emailToUse, {
        giftItemId: {
          name: populatedVoucher.giftItemId.name,
          price: populatedVoucher.giftItemId.price,
          merchantId: {
            name: populatedVoucher.giftItemId.merchantId.name,
          },
        },
        senderName: populatedVoucher.senderName || 'Anonymous',
        recipientName: populatedVoucher.recipientName || '',
        redemptionLink: populatedVoucher.redemptionLink,
        status: populatedVoucher.status,
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
    return NextResponse.json(
      { error: 'Missing voucher_id or session_id parameter' },
      { status: 400 },
    );
  } catch (error) {
    console.error('[Checkout Success] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
