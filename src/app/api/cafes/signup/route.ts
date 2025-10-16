import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Merchant from '@/models/Merchant';
import GiftItem from '@/models/GiftItem';
import { sendMerchantSignupEmail, sendAdminNotificationEmail } from '@/lib/email';



// Rate limiting (simple in-memory store - consider Redis for production)
const submissionCounts = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS = 3; // Max 3 submissions per hour per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const count = submissionCounts.get(ip) || 0;
  
  if (now - (count * RATE_LIMIT_WINDOW) > RATE_LIMIT_WINDOW) {
    submissionCounts.set(ip, 1);
    return false;
  }
  
  if (count >= MAX_SUBMISSIONS) {
    return true;
  }
  
  submissionCounts.set(ip, count + 1);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { merchant, giftItems } = body;

    // Server-side validation
    if (!merchant || !giftItems) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate merchant data
    if (!merchant.name || !merchant.address || !merchant.county || !merchant.businessEmail || !merchant.businessCategory) {
      return NextResponse.json(
        { error: 'Missing required merchant fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(merchant.businessEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate description length
    if (merchant.description && merchant.description.length > 500) {
      return NextResponse.json(
        { error: 'Description too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Validate gift items
    if (!Array.isArray(giftItems) || giftItems.length < 1 || giftItems.length > 15) {
      return NextResponse.json(
        { error: 'Must have 1-15 gift items' },
        { status: 400 }
      );
    }

    for (const item of giftItems) {
      if (!item.name || !item.categoryId || !item.price) {
        return NextResponse.json(
          { error: 'Missing required gift item fields' },
          { status: 400 }
        );
      }

      if (item.price < 0.50) {
        return NextResponse.json(
          { error: 'Price must be at least €0.50' },
          { status: 400 }
        );
      }
      
      // Check if price is in €0.10 increments (more robust check)
      const priceInCents = Math.round(item.price * 100);
      if (priceInCents % 10 !== 0) {
        return NextResponse.json(
          { error: 'Price must be in €0.10 increments (e.g., €0.50, €1.20, €5.00)' },
          { status: 400 }
        );
      }

      if (item.description && item.description.length > 200) {
        return NextResponse.json(
          { error: 'Gift item description too long (max 200 characters)' },
          { status: 400 }
        );
      }
    }



    // Sanitize text inputs (strip HTML)
    const sanitizeText = (text: string): string => {
      return text.replace(/<[^>]*>/g, '').trim();
    };

    // Connect to database
    await connectToDatabase();

    // Check if merchant already exists
    const existingMerchant = await Merchant.findOne({ 
      businessEmail: merchant.businessEmail.toLowerCase() 
    });

    if (existingMerchant) {
      return NextResponse.json(
        { error: 'A merchant with this email already exists' },
        { status: 409 }
      );
    }

    // Create merchant
    const newMerchant = new Merchant({
      name: sanitizeText(merchant.name),
      address: sanitizeText(merchant.address),
      county: merchant.county,
      description: merchant.description ? sanitizeText(merchant.description) : '',
      logoUrl: merchant.logoUrl || '',
      contactEmail: merchant.businessEmail.toLowerCase(),
      contactPhone: merchant.contactPhone ? sanitizeText(merchant.contactPhone) : '',
      website: merchant.website ? sanitizeText(merchant.website) : '',
      businessCategory: merchant.businessCategory || 'Café & Treats',
      status: 'pending',
      tags: [], // Will be populated by admin during approval
      payoutDetails: {
        accountHolderName: '',
        iban: '',
        bic: ''
      },
      brontieFeeSettings: {
        isActive: false, // Taxa desativada por padrão por 3 meses
        activatedAt: undefined,
        deactivatedAt: undefined,
        deactivatedBy: undefined,
        deactivationReason: undefined
      }
    });

    await newMerchant.save();

    // Create gift items
    const createdGiftItems = [];
    for (const item of giftItems) {
      const newGiftItem = new GiftItem({
        merchantId: newMerchant._id,
        locationIds: [], // Will be populated when locations are added
        categoryId: item.categoryId,
        name: sanitizeText(item.name),
        description: item.description ? sanitizeText(item.description) : '',
        price: item.price,
        imageUrl: item.imageUrl || '',
        isActive: false // Will be activated when merchant is approved
      });

      await newGiftItem.save();
      createdGiftItems.push(newGiftItem);
    }

    // Send notification emails
    try {
      // Email to merchant
      await sendMerchantSignupEmail(merchant.businessEmail, {
        name: merchant.name,
        email: merchant.businessEmail
      });

      // Email to admin
      await sendAdminNotificationEmail({
        merchant: {
          name: merchant.name,
          email: merchant.businessEmail,
          address: merchant.address,
          description: merchant.description,
          phone: merchant.contactPhone,
          website: merchant.website,
          businessCategory: merchant.businessCategory
        },
        giftItems: giftItems.map(item => ({
          name: item.name,
          categoryId: item.categoryId,
          price: item.price,
          description: item.description
        })),

        merchantId: newMerchant._id.toString()
      });
    } catch (emailError) {
      console.error('Failed to send notification emails:', emailError);
      // Don't fail the signup if emails fail
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      merchantId: newMerchant._id
    });

  } catch (error) {
    console.error('Café signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
