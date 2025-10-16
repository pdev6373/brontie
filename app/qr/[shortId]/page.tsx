'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trackQRCodeScanned } from '@/lib/posthog-tracking';

export default function QRValidationPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQRData = async () => {
      try {
        const shortId = params.shortId as string;
        if (!shortId) {
          setError('Invalid QR code');
          return;
        }

        // Check if user came from redeem page or is using the mobile web app
        const referrer = document.referrer;
        const isFromRedeemPage = referrer.includes('/redeem/') || referrer.includes('/voucher/');
        
        // Validate QR code and get merchant info
        const response = await fetch(`/api/qr/validate/${shortId}`);
        if (!response.ok) {
          throw new Error('QR code not found');
        }
        
        const qrData = await response.json();
        
        // Track QR scan event with PostHog
        trackQRCodeScanned({
          short_id: shortId,
          merchant_id: qrData.merchantId,
          merchant_name: qrData.merchant.name,
          location_id: qrData.locationId,
          location_name: qrData.location.name,
          is_from_redeem_page: isFromRedeemPage,
          referrer: referrer
        });
        
        // If from redeem page, redirect to scanner (existing behavior)
        if (isFromRedeemPage) {
          router.push(`/redeem/scan?qr=${shortId}`);
          return;
        }
        
        // If direct scan (not from redeem page), redirect to products page with merchant filter
        router.push(`/products?merchant=${qrData.merchantId}&location=${qrData.locationId}`);
      } catch {
        setError('QR code not found or expired');
      } finally {
        setLoading(false);
      }
    };

    fetchQRData();
  }, [params.shortId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-700">Validating QR code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 border border-orange-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
              <span className="text-red-500 text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-700 mb-4" style={{fontFamily: 'Alegreya SC, serif'}}>Invalid QR Code</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached as we redirect on success
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-700 animate-gentle-pulse">Redirecting...</p>
      </div>
    </div>
  );
}

