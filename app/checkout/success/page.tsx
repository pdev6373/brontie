'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Voucher {
  _id: string;
  redemptionLink: string;
  status: 'redeemed' | 'unredeemed' | 'refunded' | 'pending';
  giftItemId?: {
    name?: string;
    price?: number;
    imageUrl?: string;
    merchantId?: {
      name?: string;
    };
  };
  senderName?: string;
  recipientName?: string;
  createdAt: string;
  confirmedAt?: string;
  amount?: number;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const voucherId = searchParams.get('voucher_id');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check for either voucher_id (development) or session_id (production)
    if (!voucherId && !sessionId) {
      setError('No voucher ID or session ID provided');
      setLoading(false);
      return;
    }

    const fetchVoucher = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);

        // Use the outer scope variables instead of recreating them
        if (!voucherId && !sessionId) {
          setError('Missing voucher or session information');
          setLoading(false); // Important: set loading to false
          return;
        }

        console.log(`Attempting to fetch voucher details (attempt ${retryCount + 1}/5)`, {
          voucherId, 
          sessionId
        });

        const queryParam = voucherId ? `voucher_id=${voucherId}` : `session_id=${sessionId}`;
        const response = await fetch(`/api/checkout/success?${queryParam}`);
        const data = await response.json();

        if (data.success && data.voucher) {
          console.log('Successfully retrieved voucher');
          setVoucher(data.voucher);
          setLoading(false); // Important: set loading to false on success
        } else {
          // Check if this is a specific test session error
          if (data.error === 'Test session missing metadata') {
            setError(`Test Session Issue: ${data.details}`);
            setLoading(false);
            return;
          }
          
          // Retry logic - works for both voucher_id and session_id
          const maxRetries = 5;
          if (retryCount < maxRetries) {
            // Progressive delay: 2s, 4s, 6s, 8s, 10s
            const delay = (retryCount + 1) * 2000;
            const errorDetail = data.error || 'Unknown error';
            console.log(`Voucher not found (${errorDetail}), retrying in ${delay/1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`);
            
            // Show a waiting message instead of error during retries
            setError(`Still processing your payment. Retrying in ${delay/1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`);
            
            setTimeout(() => {
              fetchVoucher(retryCount + 1);
            }, delay);
            return;
          }
          
          // Only show final error after all retries
          setError(data.error || 'Failed to load voucher details. Please try refreshing the page in a few moments.');
          setLoading(false); // Important: set loading to false after retries exhausted
        }
      } catch (error) {
        console.error('Error fetching voucher:', error);
        
        // Retry logic for network errors - works for both voucher_id and session_id
        const maxRetries = 5;
        if (retryCount < maxRetries) {
          // Progressive delay: 2s, 4s, 6s, 8s, 10s
          const delay = (retryCount + 1) * 2000;
          console.log(`Network error, retrying in ${delay/1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Show a waiting message instead of error during retries
          setError(`Connection issue. Retrying in ${delay/1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`);
          
          setTimeout(() => {
            fetchVoucher(retryCount + 1);
          }, delay);
          return;
        }
        
        setError('Network error while fetching voucher details. Please check your connection and try refreshing the page.');
        setLoading(false); // Important: set loading to false after retries exhausted
      }
    };

    fetchVoucher();
  }, [sessionId, voucherId, searchParams, retryCount]);

  const handleManualRetry = () => {
    console.log('Manual retry initiated by user');
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-slate-700">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Show a different UI for when we're still retrying vs. when we've given up
    const isRetrying = error.includes('Retrying in');
    const isTestSessionError = error.includes('Test Session Issue');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg border border-orange-100">
          <div className={`border px-4 py-3 rounded-xl mb-4 ${isRetrying ? 'bg-amber-50 border-amber-200 text-amber-700' : isTestSessionError ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {isRetrying ? (
              <div className="flex flex-col items-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-2"></div>
                {error}
              </div>
            ) : isTestSessionError ? (
              <div className="text-left">
                <h3 className="font-semibold mb-2">Test Session Issue</h3>
                <p className="text-sm mb-3">{error.replace('Test Session Issue: ', '')}</p>
                <div className="bg-blue-100 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Go back to the homepage</li>
                    <li>Select a gift item</li>
                    <li>Complete a new test purchase</li>
                    <li>Use test card: 4242 4242 4242 4242</li>
                  </ol>
                </div>
              </div>
            ) : error}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {!isTestSessionError && (
              <button
                onClick={handleManualRetry}
                className="bg-orange-600 text-white px-4 py-2 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500 font-bold"
                disabled={loading}
              >
                Try Again
              </button>
            )}
            <Link
              href="/"
              className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full hover:bg-orange-200 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-300 font-bold"
            >
              {isTestSessionError ? 'Create New Test Purchase' : 'Return to Homepage'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg border border-orange-100">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-300">
            <span className="text-orange-500 text-2xl">?</span>
          </div>
          <p className="text-slate-700 mb-4">Voucher not found</p>
          <Link href="/" className="bg-orange-600 text-white font-bold px-6 py-2 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500 inline-block">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/redeem/${voucher.redemptionLink}`;
  
  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=I've sent you a gift! Redeem it here: ${encodeURIComponent(shareUrl)}`);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-200 animate-gentle-pulse">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-700" style={{fontFamily: 'Alegreya SC, serif'}}>Payment Successful!</h1>
          <p className="text-slate-600 mt-2">Your gift voucher has been created</p>
          {voucher.status === 'pending' && (
            <div className="mt-3 bg-yellow-50 border border-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Payment is being processed. The voucher will be redeemable once confirmed.</span>
              </div>
            </div>
          )}
        </div>

        {/* Voucher Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-orange-100">
          <h2 className="text-xl font-semibold mb-4 text-slate-700" style={{fontFamily: 'Alegreya SC, serif'}}>Gift Details</h2>
          
          {/* Product Image */}
          {voucher.giftItemId?.imageUrl && (
            <div className="mb-4">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-orange-100 shadow-sm">
                <Image
                  src={voucher.giftItemId.imageUrl}
                  alt={voucher.giftItemId?.name || 'Gift Item'}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Gift Item:</span>
              <span className="font-medium text-slate-700">
                {voucher.giftItemId?.name || 'Gift Item'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Merchant:</span>
              <span className="font-medium text-slate-700">
                {voucher.giftItemId?.merchantId?.name || 'Merchant'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Amount:</span>
              <span className="font-medium text-orange-600 animate-gentle-pulse">
                €{voucher.giftItemId?.price?.toFixed(2) || voucher.amount?.toFixed(2) || '0.00'}
              </span>
            </div>
            {voucher.senderName && (
              <div className="flex justify-between">
                <span className="text-slate-600">From:</span>
                <span className="font-medium text-slate-700">{voucher.senderName}</span>
              </div>
            )}
            {voucher.recipientName && (
              <div className="flex justify-between">
                <span className="text-slate-600">To:</span>
                <span className="font-medium text-slate-700">{voucher.recipientName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Share Options */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-orange-100">
          <h2 className="text-xl font-semibold mb-4 text-slate-700" style={{fontFamily: 'Alegreya SC, serif'}}>Share Your Gift</h2>
          <div className="space-y-4">
            <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
              <p className="text-sm text-slate-600 mb-2">Redemption Link:</p>
              <p className="text-sm font-mono break-all text-slate-700">{shareUrl}</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={shareViaWhatsApp}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500"
              >
                Share via WhatsApp
              </button>
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-slate-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-midnight-teal"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-orange-100 via-yellow-100 to-green-100 rounded-2xl p-6 text-center border border-orange-200 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-2" style={{fontFamily: 'Alegreya SC, serif'}}>Next Steps</h3>
          <p className="text-slate-600 mb-4">
            Share the redemption link with your recipient. They can visit any valid merchant location and scan the QR code to redeem their gift.
          </p>
          <Link
            href="/"
            className="inline-block bg-orange-600 !text-white font-bold px-6 py-2 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500"
          >
            Send Another Gift
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-slate-700">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
