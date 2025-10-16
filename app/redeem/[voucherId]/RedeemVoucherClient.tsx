'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRScanner from '@/components/QRScanner';

interface Voucher {
  _id: string;
  giftItemId: {
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    merchantId: {
      name: string;
    };
  };
  recipientName?: string;
  senderName?: string;
  senderMessage?: string;
  status: 'unredeemed' | 'redeemed' | 'pending' | 'refunded';
  createdAt: string;
  redeemedAt?: string;
  refundedAt?: string;
  confirmedAt?: string;
  validLocationIds: string[];
}

interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
  merchantId: string;
}

interface RedemptionData {
  voucher: {
    giftItemId: {
      name: string;
    };
    redeemedAt: string;
  };
  merchantLocation: {
    name: string;
    address: string;
  };
}

interface RedeemVoucherClientProps {
  voucherId: string;
  initialData: {
    voucher: Voucher;
    locations: MerchantLocation[];
  } | null;
}

// Real-time clock component
function RealtimeClock() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };

    // Update immediately
    updateTime();
    
    // Update every second
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-6xl font-mono font-bold text-amber-700 mb-6 tracking-wider">
      {currentTime}
    </div>
  );
}

export default function RedeemVoucherClient({ voucherId, initialData }: RedeemVoucherClientProps) {
  const [voucher, setVoucher] = useState<Voucher | null>(initialData?.voucher || null);
  const [locations, setLocations] = useState<MerchantLocation[]>(initialData?.locations || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);
  const [redemptionData, setRedemptionData] = useState<RedemptionData | null>(null);

  // Fetch voucher data if not provided
  useEffect(() => {
    if (!initialData) {
      const fetchVoucherData = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/voucher/${voucherId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch voucher: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!data || !data.voucher) {
            throw new Error('Voucher not found');
          }
          
          setVoucher(data.voucher);
          setLocations(data.locations || []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load voucher');
        } finally {
          setLoading(false);
        }
      };
      
      fetchVoucherData();
    }
  }, [voucherId, initialData]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-slate-700">Loading voucher...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !voucher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex flex-col justify-center items-center text-center py-12">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-300">
          <span className="text-orange-500 text-2xl">❌</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-700 mb-4">Voucher Not Found</h1>
        <p className="text-slate-600 mb-6">{error || 'The requested voucher could not be found.'}</p>
        <Link href="/" className="bg-orange-600 text-white font-bold px-6 py-3 rounded-full hover:bg-orange-700 transition-all duration-300">
          Return to Home
        </Link>
      </div>
    );
  }

  const handleRedeemClick = () => {
    if (voucher?.status === 'redeemed') {
      setError('This voucher has already been redeemed');
      return;
    }
    if (voucher?.status === 'pending') {
      setError('This voucher payment is still being processed. Please try again later.');
      return;
    }
    if (voucher?.status === 'refunded') {
      setError('This voucher has been refunded and is no longer valid.');
      return;
    }
    setShowRedeemConfirm(true);
  };

  const handleConfirmRedeem = () => {
    setShowRedeemConfirm(false);
    setShowQRScanner(true);
  };

  const handleQRScanSuccess = async (qrData: string) => {
    try {
      setShowQRScanner(false);
      
      let locationId: string;
      
      // Determine if this is a new short ID format or old encrypted format
      if (qrData.includes('/qr/') && qrData.length < 100) {
        // New short ID format: extract shortId from URL like "https://brontie.ie/qr/Kx7mP9qR"
        const shortIdMatch = qrData.match(/\/qr\/([a-zA-Z0-9]+)$/);
        if (!shortIdMatch) {
          throw new Error('Invalid QR code format');
        }
        
        const shortId = shortIdMatch[1];
        
        // Validate the short ID with the new API
        const validateResponse = await fetch(`/api/qr/validate/${shortId}`);
        if (!validateResponse.ok) {
          const errorData = await validateResponse.json();
          throw new Error(errorData.error || 'Invalid QR code');
        }
        
        const validationData = await validateResponse.json();
        locationId = validationData.locationId;
        
      } else {
        // Old encrypted format: use the legacy decrypt API
        const decryptResponse = await fetch('/api/qr/decrypt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            encryptedData: qrData,
            voucherId: voucherId 
          }),
        });

        if (!decryptResponse.ok) {
          const errorData = await decryptResponse.json();
          throw new Error(errorData.error || 'Invalid QR code');
        }

        const decryptedData = await decryptResponse.json();
        locationId = decryptedData.locationId;
      }
      
      // Proceed with voucher redemption using the extracted locationId
      const redeemResponse = await fetch(`/api/voucher/${voucherId}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantLocationId: locationId
        }),
      });

      if (!redeemResponse.ok) {
        const errorData = await redeemResponse.json();
        throw new Error(errorData.error || 'Failed to redeem voucher');
      }

      const redemptionResult = await redeemResponse.json();
      setRedemptionData(redemptionResult);
      setRedemptionSuccess(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process redemption');
    }
  };

  const handleQRScanError = (error: string) => {
    setShowQRScanner(false);
    setError(error);
  };

  if (redemptionSuccess && redemptionData) {
    return (
      <div className="min-h-screen bg-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Voucher Redeemed!</h1>
          <RealtimeClock />
          
          {/* Product Image */}
          {voucher?.giftItemId?.imageUrl && (
            <div className="mb-4">
              <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden border border-amber-200 shadow-sm">
                <Image
                  src={voucher.giftItemId.imageUrl}
                  alt={redemptionData.voucher.giftItemId.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          
          <div className="bg-amber-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-amber-800 mb-2">{redemptionData.voucher.giftItemId.name}</h2>
            <p className="text-gray-600 text-sm mb-2">
              Redeemed at: {redemptionData.merchantLocation.name}
            </p>
            <p className="text-gray-600 text-sm mb-2">
              {redemptionData.merchantLocation.address}
            </p>
            <p className="text-gray-500 text-xs">
              {new Date(redemptionData.voucher.redeemedAt).toLocaleString()}
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            Enjoy your {redemptionData.voucher.giftItemId.name}!
          </p>
          <Link 
            href="/" 
            className="bg-amber-700 !text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (showQRScanner) {
    return (
      <div className="min-h-screen bg-amber-100">
        <QRScanner
          onScanSuccess={handleQRScanSuccess}
          onScanError={handleQRScanError}
          onClose={() => setShowQRScanner(false)}
        />
      </div>
    );
  }

  if (showRedeemConfirm) {
    return (
      <div className="min-h-screen bg-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Confirm Redemption</h1>
          <div className="bg-amber-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-amber-800 mb-2">{voucher?.giftItemId.name}</h2>
            <p className="text-gray-600 text-sm mb-2">
              From: {voucher?.senderName}
            </p>
            <p className="text-gray-600 text-sm">
              To: {voucher?.recipientName}
            </p>
          </div>
          <p className="text-gray-600 mb-6 text-center">
            You&apos;re about to redeem this voucher. Make sure you&apos;re at the merchant location and ready to scan their QR code.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setShowRedeemConfirm(false)}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRedeem}
              className="flex-1 bg-amber-700 text-white px-4 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              Proceed to Scan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 text-center">
          <h1 className="text-2xl !text-white font-bold mb-2" style={{fontFamily: 'Alegreya SC, serif'}}>Gift Voucher</h1>
          <p className="!text-orange-100 font-semibold">
            {voucher?.status === 'redeemed' ? 'Already Redeemed' : 
             voucher?.status === 'pending' ? 'Payment Processing' : 
             voucher?.status === 'refunded' ? 'Refunded' : 'Ready to Redeem'}
          </p>
        </div>

        {/* Voucher Details */}
        <div className="p-6">
          {/* Product Image */}
          {voucher?.giftItemId?.imageUrl && (
            <div className="mb-6">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-orange-100 shadow-sm">
                <Image
                  src={voucher.giftItemId.imageUrl}
                  alt={voucher.giftItemId.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-700 mb-2">
              {voucher?.giftItemId?.name || 'Gift Item'}
            </h2>
            <p className="text-slate-600 text-sm mb-4">
              {voucher?.giftItemId?.description || ''}
            </p>
          </div>

          {/* Gift Details */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-5 mb-6 border border-orange-100 shadow-sm">
            <div className="grid grid-cols-2 gap-4 text-lg">
              <div>
                <span className="text-slate-500">From:</span>
                <p className="font-semibold text-slate-700">{voucher?.senderName || 'Anonymous'}</p>
              </div>
              <div>
                <span className="text-slate-500">To:</span>
                <p className="font-semibold text-slate-700">{voucher?.recipientName || 'Recipient'}</p>
              </div>
            </div>
            {voucher?.senderMessage && (
              <div className="mt-4 pt-4 border-t border-orange-200">
                <span className="text-slate-500 text-sm">Message:</span>
                <p className="text-slate-700 italic">&quot;{voucher?.senderMessage}&quot;</p>
              </div>
            )}
          </div>

          {/* Merchant Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-700 mb-2">Redeem at:</h3>
            <div className="bg-gradient-to-r from-parchment-white to-ivory-mist rounded-xl p-4 border border-green-100 shadow-sm">
              <p className="font-medium text-midnight-teal">{voucher?.giftItemId.merchantId.name}</p>
              {locations.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-olive-green font-medium">Available locations:</p>
                  {locations.map((location) => (
                    <div key={location._id} className="text-sm text-slate-700 mt-2 p-2 bg-white/70 rounded-lg">
                      <p className="font-medium">{location.name}</p>
                      <p className="text-slate-600">{location.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          {voucher?.status === 'redeemed' ? (
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-xl mr-2">✨</span>
                  <p className="text-green-700 font-medium">Voucher Redeemed</p>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  {voucher?.redeemedAt && new Date(voucher.redeemedAt).toLocaleString()}
                </p>
              </div>
              <Link 
                href="/" 
                className="group bg-orange-600 !text-white font-bold px-8 py-3 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-orange-500 inline-block"
              >
                <span className="flex items-center justify-center gap-2">
                  Back to Home
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </Link>
            </div>
          ) : voucher?.status === 'pending' ? (
            <div className="text-center">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-100 border border-yellow-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-xl mr-2">⏳</span>
                  <p className="text-amber-700 font-medium">Payment Processing</p>
                </div>
                <p className="text-amber-600 text-sm mt-1">
                  This voucher is not yet redeemable. The payment is still being processed.
                </p>
              </div>
              <Link 
                href="/" 
                className="group bg-orange-600 !text-white font-bold px-8 py-3 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-orange-500 inline-block"
              >
                <span className="flex items-center justify-center gap-2">
                  Back to Home
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </Link>
            </div>
          ) : voucher?.status === 'refunded' ? (
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-xl mr-2">↩️</span>
                  <p className="text-red-700 font-medium">Voucher Refunded</p>
                </div>
                <p className="text-red-600 text-sm mt-1">
                  This voucher has been refunded and is no longer valid.
                  {voucher?.refundedAt && ` Refunded on ${new Date(voucher.refundedAt).toLocaleString()}`}
                </p>
              </div>
              <Link 
                href="/" 
                className="group bg-orange-600 !text-white font-bold px-8 py-3 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-orange-500 inline-block"
              >
                <span className="flex items-center justify-center gap-2">
                  Back to Home
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </Link>
            </div>
          ) : (
            <div className="text-center">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              <button
                onClick={handleRedeemClick}
                className="w-full bg-orange-600 text-white font-bold px-8 py-4 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-orange-500"
              >
                REDEEM VOUCHER
              </button>
              <p className="text-slate-600 text-sm mt-3">
                You&apos;ll need to scan a QR code at the merchant location
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
