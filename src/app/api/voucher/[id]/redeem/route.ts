import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import RedemptionLog from '@/models/RedemptionLog';
import MerchantLocation from '@/models/MerchantLocation';
import Transaction from '@/models/Transaction';
import GiftItem from '@/models/GiftItem';
import PayoutItem from '@/models/PayoutItem';
import mongoose from 'mongoose';
import { getStripeFee } from '@/lib/stripe-fees';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const voucherId = id;
    const body = await request.json();
    const { merchantLocationId } = body;
    
    // Validate required fields
    if (!merchantLocationId) {
      return NextResponse.json(
        { error: 'Missing required field: merchantLocationId' },
        { status: 400 }
      );
    }
    
    // Verify merchant location exists
    const merchantLocation = await MerchantLocation.findById(merchantLocationId);
    if (!merchantLocation) {
      return NextResponse.json(
        { error: 'Merchant location not found' },
        { status: 404 }
      );
    }
    
    // Find voucher by redemption link
    const voucher = await Voucher.findOne({ 
      redemptionLink: voucherId 
    }).populate({
      path: 'giftItemId',
      populate: {
        path: 'merchantId',
        select: 'name _id'
      }
    });
    
    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      );
    }
    
    // Check voucher status
    if (voucher.status === 'redeemed') {
      return NextResponse.json(
        { error: 'Voucher has already been redeemed' },
        { status: 400 }
      );
    }
    
    // Check if voucher is pending payment confirmation
    if (voucher.status === 'pending') {
      return NextResponse.json(
        { error: 'Voucher payment is still being processed. Please try again later.' },
        { status: 400 }
      );
    }
    
    // Check if voucher has been refunded
    if (voucher.status === 'refunded') {
      return NextResponse.json(
        { error: 'This voucher has been refunded and is no longer valid.' },
        { status: 400 }
      );
    }
    
    // Validate that this location is valid for the voucher
    const isValidLocation = voucher.validLocationIds.some(
      (locationId: mongoose.Types.ObjectId) => locationId.toString() === merchantLocationId
    );
    
    if (!isValidLocation) {
      return NextResponse.json(
        { error: 'This voucher cannot be redeemed at this location' },
        { status: 400 }
      );
    }
    
    // Update voucher status
    voucher.status = 'redeemed';
    voucher.redeemedAt = new Date();
    await voucher.save();
    
    // Create redemption log
    await RedemptionLog.create({
      voucherId: voucher._id,
      merchantLocationId,
      timestamp: new Date()
    });

    // Create redemption transaction
    await createRedemptionTransaction(voucher, merchantLocation);
    
    // Create purchase transaction (this is when the merchant gets paid)
    await createPurchaseTransaction(voucher);
    
    return NextResponse.json({
      success: true,
      message: 'Voucher redeemed successfully',
      voucher: {
        id: voucher._id,
        giftItemId: voucher.giftItemId,
        redeemedAt: voucher.redeemedAt,
        recipientName: voucher.recipientName,
        senderName: voucher.senderName
      },
      merchantLocation: {
        name: merchantLocation.name,
        address: merchantLocation.address
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error redeeming voucher:', error);
    return NextResponse.json(
      { error: 'Failed to redeem voucher' },
      { status: 500 }
    );
  }
}

// Function to create redemption transaction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createRedemptionTransaction(voucher: any, merchantLocation: any) {
  try {
    if (!voucher.giftItemId || !voucher.giftItemId.merchantId) {
      console.error('Gift item or merchant not found for redemption transaction');
      return;
    }

    const amount = voucher.amount || voucher.giftItemId.price;

    // Create redemption transaction record
    const transaction = new Transaction({
      voucherId: voucher._id,
      merchantId: voucher.giftItemId.merchantId._id,
      giftItemId: voucher.giftItemId._id,
      type: 'redemption',
      amount: amount,
      status: 'completed',
      customerEmail: voucher.email,
      senderName: voucher.senderName,
      recipientName: voucher.recipientName,
      completedAt: new Date()
    });

    await transaction.save();

    console.log('Redemption transaction created:', {
      transactionId: transaction._id,
      voucherId: voucher._id,
      merchantId: voucher.giftItemId.merchantId._id,
      amount: amount,
      locationId: merchantLocation._id
    });

  } catch (error) {
    console.error('Error creating redemption transaction:', error);
    // Don't throw error to avoid redemption failure
  }
}

// Create purchase transaction when voucher is redeemed (merchant gets paid)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createPurchaseTransaction(voucher: any) {
  try {
    // Get gift item with merchant details
    const giftItem = await GiftItem.findById(voucher.giftItemId).populate('merchantId');
    if (!giftItem || !giftItem.merchantId) {
      console.error('Gift item or merchant not found for purchase transaction');
      return;
    }

    const merchant = giftItem.merchantId;
    const amount = voucher.amount || giftItem.price;
    
    // Get actual Stripe fee if available, otherwise use stored fee or estimate
    let stripeFee = voucher.stripeFee || 0;
    if (!stripeFee && voucher.paymentIntentId) {
      stripeFee = await getStripeFee(voucher.paymentIntentId, amount);
    }
    if (!stripeFee) {
      // Fallback to estimated fee (1.4% + €0.25)
      stripeFee = (amount * 0.014) + 0.25;
    }
    
    // Check if Brontie fee is active
    const isBrontieFeeActive = merchant.brontieFeeSettings && merchant.brontieFeeSettings.isActive;
    const netAfterStripe = amount - stripeFee;
    const brontieCommission = isBrontieFeeActive ? netAfterStripe * 0.10 : 0;
    const merchantPayout = netAfterStripe - brontieCommission;

    // Create purchase transaction record
    const transaction = new Transaction({
      voucherId: voucher._id,
      merchantId: merchant._id,
      giftItemId: giftItem._id,
      type: 'purchase',
      amount: amount,
      status: 'completed',
      customerEmail: voucher.email,
      senderName: voucher.senderName,
      recipientName: voucher.recipientName,
      stripeFee: stripeFee,
      brontieCommission: brontieCommission,
      merchantPayout: merchantPayout,
      completedAt: new Date()
    });

    await transaction.save();
    console.log('Purchase transaction created:', transaction._id);

    // Create payout item for this redemption
    const payoutItem = new PayoutItem({
      voucherId: voucher._id,
      merchantId: merchant._id,
      amountPayable: merchantPayout,
      brontieFee: brontieCommission,
      stripeFee: stripeFee,
      status: 'pending',
    });

    await payoutItem.save();
    console.log('Payout item created:', payoutItem._id);
  } catch (error) {
    console.error('Error creating purchase transaction:', error);
  }
}
