import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Merchant from '@/models/Merchant';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find merchant by email
    const merchant = await Merchant.findOne({ 
      contactEmail: email.toLowerCase(),
      status: 'approved' // Only approved merchants can login
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Invalid credentials or account not approved' },
        { status: 401 }
      );
    }

    // Check if merchant has a password (not temp password)
    if (!merchant.password) {
      // First time login with temp password
      if (merchant.tempPassword && password === merchant.tempPassword) {
        return NextResponse.json({
          requiresPasswordChange: true,
          message: 'Please change your temporary password'
        });
      }
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, merchant.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        merchantId: merchant._id,
        email: merchant.contactEmail,
        name: merchant.name
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      merchant: {
        id: merchant._id,
        name: merchant.name,
        email: merchant.contactEmail,
        status: merchant.status
      }
    });

    response.cookies.set('cafe-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Café login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
