import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import MerchantLocation from '@/models/MerchantLocation';
import Merchant from '@/models/Merchant';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const merchantId = id;
    
    const locations = await MerchantLocation.find({ merchantId })
      .select('name address city county zipCode country latitude longitude photoUrl phoneNumber openingHours accessibility')
      .sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      locations
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching merchant locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant locations' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const merchantId = id;
    
    // Verify merchant exists
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    const { 
      name, 
      address, 
      city, 
      county, 
      zipCode, 
      country, 
      latitude, 
      longitude, 
      photoUrl, 
      phoneNumber, 
      openingHours, 
      accessibility 
    } = body;
    
    if (!name || !address || !county || !zipCode) {
      return NextResponse.json(
        { error: 'Name, address, county, and zip code are required' },
        { status: 400 }
      );
    }
    
    const location = new MerchantLocation({
      merchantId,
      name,
      address,
      city: city || '',
      county,
      zipCode,
      country: country || 'Ireland',
      latitude,
      longitude,
      photoUrl,
      phoneNumber,
      openingHours,
      accessibility
    });
    
    await location.save();
    
    return NextResponse.json({
      success: true,
      location
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating merchant location:', error);
    return NextResponse.json(
      { error: 'Failed to create merchant location' },
      { status: 500 }
    );
  }
}
