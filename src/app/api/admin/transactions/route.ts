import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Voucher from '@/models/Voucher';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const merchantId = searchParams.get('merchantId');
    const giftItemId = searchParams.get('giftItemId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const isExport = searchParams.get('export') === 'true';
    
    // Build aggregation pipeline for filtering
    interface MatchStage {
      giftItemId?: mongoose.Types.ObjectId;
      status?: string;
      createdAt?: {
        $gte?: Date;
        $lte?: Date;
      };
    }
    
    const matchStage: MatchStage = {};
    
    if (giftItemId && mongoose.Types.ObjectId.isValid(giftItemId)) {
      matchStage.giftItemId = new mongoose.Types.ObjectId(giftItemId);
    }
    
    if (status) {
      matchStage.status = status;
    }
    
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) {
        matchStage.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        matchStage.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // Base aggregation pipeline
    const basePipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'giftitems',
          localField: 'giftItemId',
          foreignField: '_id',
          as: 'giftItem'
        }
      },
      { $unwind: { path: '$giftItem', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'merchants',
          localField: 'giftItem.merchantId',
          foreignField: '_id',
          as: 'merchant'
        }
      },
      { $unwind: { path: '$merchant', preserveNullAndEmptyArrays: true } },
      // For all vouchers, get the valid locations as fallback
      {
        $lookup: {
          from: 'merchantlocations',
          localField: 'validLocationIds',
          foreignField: '_id',
          as: 'validLocations'
        }
      },
      // For redeemed vouchers, get the actual redemption location
      {
        $lookup: {
          from: 'redemptionlogs',
          localField: '_id',
          foreignField: 'voucherId',
          as: 'redemptionLog'
        }
      },
      // For redeemed vouchers, get the actual redemption location details
      {
        $lookup: {
          from: 'merchantlocations',
          localField: 'redemptionLog.merchantLocationId',
          foreignField: '_id',
          as: 'redemptionLocation'
        }
      }
    ];

    // Add merchant filter after lookup if specified
    if (merchantId && mongoose.Types.ObjectId.isValid(merchantId)) {
      const merchantMatchStage: { [key: string]: mongoose.Types.ObjectId } = {
        'merchant._id': new mongoose.Types.ObjectId(merchantId)
      };
      basePipeline.push({
        $match: merchantMatchStage
      });
    }
    
    if (isExport) {
      // Export all matching records as CSV
      const vouchers = await Voucher.aggregate([
        ...basePipeline,
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            giftItemName: '$giftItem.name',
            merchantName: '$merchant.name',
            locationName: {
              $cond: {
                if: { $gt: [{ $size: '$redemptionLocation' }, 0] },
                then: { $arrayElemAt: ['$redemptionLocation.name', 0] },
                else: { $arrayElemAt: ['$validLocations.name', 0] }
              }
            },
            amount: { 
              $ifNull: [
                '$amount', 
                { $ifNull: ['$giftItem.price', 0] }
              ] 
            },
            status: 1,
            recipientName: 1,
            senderName: 1,
            createdAt: 1,
            redeemedAt: 1,
            paymentIntentId: 1
          }
        }
      ]);
      
      const csvHeaders = [
        'ID',
        'Gift Item',
        'Merchant',
        'Location',
        'Price',
        'Status',
        'Recipient Name',
        'Sender Name',
        'Created Date',
        'Redeemed Date',
        'Payment ID'
      ];
      
      const csvRows = vouchers.map(voucher => [
        voucher._id.toString(),
        voucher.giftItemName || 'N/A',
        voucher.merchantName || 'N/A',
        voucher.locationName || 'N/A',
        (voucher.amount || 0).toString(),
        voucher.status,
        voucher.recipientName || 'N/A',
        voucher.senderName || 'N/A',
        voucher.createdAt.toISOString(),
        voucher.redeemedAt ? voucher.redeemedAt.toISOString() : 'N/A',
        voucher.paymentIntentId || 'N/A'
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="transactions.csv"'
        }
      });
    }
    
    // Regular paginated response
    const skip = (page - 1) * limit;
    
    // Get total count
    const totalResult = await Voucher.aggregate([
      ...basePipeline,
      { $count: 'total' }
    ]);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    
    // Get paginated results
    const vouchers = await Voucher.aggregate([
      ...basePipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          giftItemName: '$giftItem.name',
          giftItemId: '$giftItem._id',
          merchantName: '$merchant.name',
          merchantId: '$merchant._id',
          locationName: {
            $cond: {
              if: { $gt: [{ $size: '$redemptionLocation' }, 0] },
              then: { $arrayElemAt: ['$redemptionLocation.name', 0] },
              else: { $arrayElemAt: ['$validLocations.name', 0] }
            }
          },
          locationId: {
            $cond: {
              if: { $gt: [{ $size: '$redemptionLocation' }, 0] },
              then: { $arrayElemAt: ['$redemptionLocation._id', 0] },
              else: { $arrayElemAt: ['$validLocations._id', 0] }
            }
          },
          amount: 1,
          status: 1,
          recipientName: 1,
          senderName: 1,
          createdAt: 1,
          redeemedAt: 1,
          paymentIntentId: 1
        }
      }
    ]);
    
    // Transform the data to match expected format
    const transactions = vouchers.map(voucher => ({
      _id: voucher._id,
      giftItemName: voucher.giftItemName || 'N/A',
      giftItemId: voucher.giftItemId || null,
      merchantName: voucher.merchantName || 'N/A',
      merchantId: voucher.merchantId || null,
      locationName: voucher.locationName || 'N/A',
      locationId: voucher.locationId || null,
      amount: voucher.amount || 0, // Ensure amount is always a number
      status: voucher.status,
      recipientName: voucher.recipientName || 'N/A',
      senderName: voucher.senderName || 'N/A',
      createdAt: voucher.createdAt,
      redeemedAt: voucher.redeemedAt || null,
      paymentIntentId: voucher.paymentIntentId || null
    }));
    
    return NextResponse.json({
      success: true,
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
