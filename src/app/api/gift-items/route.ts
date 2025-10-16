import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GiftItem from '@/models/GiftItem';
import Category from '@/models/Category';
import Merchant from '@/models/Merchant';
import MerchantLocation from '@/models/MerchantLocation';

interface QueryFilter {
  isActive: boolean;
  categoryId?: string;
  merchantId?: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Ensure all models are registered
    void Merchant;
    void MerchantLocation;
    void Category;
    
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const merchantId = searchParams.get('merchant');
    
    const query: QueryFilter = { isActive: true };
    
    // Filter by category if provided
    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug, isActive: true });
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      query.categoryId = category._id.toString();
    }
    
    // Filter by merchant if provided
    if (merchantId) {
      query.merchantId = merchantId;
    }
    
    const giftItems = await GiftItem.find(query)
      .populate('merchantId', 'name logoUrl county')
      .populate('locationIds', 'name address county')
      .sort({ name: 1 });
    
    return NextResponse.json({
      success: true,
      giftItems
    });
  } catch (error) {
    console.error('Error fetching gift items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gift items' },
      { status: 500 }
    );
  }
}
