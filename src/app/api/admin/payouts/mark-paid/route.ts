import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import PayoutItem from '@/models/PayoutItem';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const { merchantId, paidUpToDate } = await request.json();

    if (!merchantId || !paidUpToDate) {
      return NextResponse.json(
        { error: 'Missing merchantId or paidUpToDate' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const merchantObjectId = new mongoose.Types.ObjectId(merchantId);
    const cutoffDate = new Date(paidUpToDate);

    // Find all pending payout items for this merchant up to the cutoff date
    const pendingItems = await PayoutItem.find({
      merchantId: merchantObjectId,
      status: 'pending',
      createdAt: { $lte: cutoffDate }
    });

    if (pendingItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending items found for the specified date range',
        markedAsPaid: 0
      });
    }

    // Mark items as paid
    const result = await PayoutItem.updateMany(
      {
        merchantId: merchantObjectId,
        status: 'pending',
        createdAt: { $lte: cutoffDate }
      },
      {
        status: 'paid',
        paidOutAt: new Date(),
        paymentMethod: 'manual_bank_transfer',
        notes: `Marked as paid manually up to ${cutoffDate.toISOString().split('T')[0]}`
      }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${result.modifiedCount} items as paid`,
      markedAsPaid: result.modifiedCount,
      cutoffDate: cutoffDate.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error('Error marking payouts as paid:', error);
    return NextResponse.json(
      { error: 'Failed to mark payouts as paid' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Missing merchantId' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const merchantObjectId = new mongoose.Types.ObjectId(merchantId);

    // Get payout summary for the merchant
    const summary = await PayoutItem.aggregate([
      {
        $match: { merchantId: merchantObjectId }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amountPayable' },
          latestDate: { $max: '$createdAt' }
        }
      }
    ]);

    // Get recent payout items
    const recentItems = await PayoutItem.find({
      merchantId: merchantObjectId
    })
    .populate('voucherId')
    .sort({ createdAt: -1 })
    .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        recentItems: recentItems.map(item => ({
          id: item._id,
          voucherId: item.voucherId,
          amountPayable: item.amountPayable,
          status: item.status,
          createdAt: item.createdAt,
          paidOutAt: item.paidOutAt,
          paymentMethod: item.paymentMethod,
          notes: item.notes
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching payout summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout summary' },
      { status: 500 }
    );
  }
}
