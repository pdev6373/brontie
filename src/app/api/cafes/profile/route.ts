import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get merchant ID from JWT token
    const token = request.cookies.get('cafe-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get merchant profile
    const merchant = await Merchant.findById(merchantId).select('-password -tempPassword');
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(merchant);

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get merchant ID from JWT token
    const token = request.cookies.get('cafe-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { merchantId: string };
    const merchantId = decoded.merchantId;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, address, description, contactEmail, contactPhone, website, logoUrl } = body;

    // Validation
    if (!name || !address || !contactEmail) {
      return NextResponse.json(
        { error: 'Name, address, and contact email are required' },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Update merchant profile
    const updatedMerchant = await Merchant.findByIdAndUpdate(
      merchantId,
      {
        name,
        address,
        description,
        contactEmail: contactEmail.toLowerCase(),
        contactPhone,
        website,
        logoUrl
      },
      { new: true, runValidators: true }
    ).select('-password -tempPassword');

    if (!updatedMerchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      merchant: updatedMerchant
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
