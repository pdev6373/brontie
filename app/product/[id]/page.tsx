'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Merchant {
  _id: string;
  name: string;
  logoUrl?: string;
  contactEmail: string;
}

interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
}

interface GiftItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  merchantId: Merchant;
  locationIds: MerchantLocation[];
  categoryId: Category;
  isActive: boolean;
}

export default function GiftItemPage() {
  const params = useParams();
  const giftItemId = params.id as string;
  
  const [giftItem, setGiftItem] = useState<GiftItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    senderName: '',
    recipientName: ''
  });
  const [isCreatingVoucher, setIsCreatingVoucher] = useState(false);

  useEffect(() => {
    const fetchGiftItem = async () => {
      try {
        const response = await fetch(`/api/gift-items/${giftItemId}`);
        if (!response.ok) {
          throw new Error('Gift item not found');
        }
        const data = await response.json();
        if (data.success) {
          setGiftItem(data.giftItem);
        } else {
          throw new Error('Failed to load gift item');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading gift item');
      } finally {
        setLoading(false);
      }
    };

    if (giftItemId) {
      fetchGiftItem();
    }
  }, [giftItemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingVoucher(true);
    setError('');

    try {
      // Get viral loop referral token from localStorage or cookie
      let refToken = '';
      if (typeof window !== 'undefined') {
        // Try localStorage first
        refToken = localStorage.getItem('brontie_recipient_id') || '';
        
        // If not in localStorage, try cookie
        if (!refToken) {
          const cookies = document.cookie.split(';');
          const refCookie = cookies.find(c => c.trim().startsWith('brontie_recipient_id='));
          if (refCookie) {
            refToken = refCookie.split('=')[1];
          }
        }
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          giftItemId: giftItem?._id,
          senderName: formData.senderName,
          recipientName: formData.recipientName,
          ref: refToken // Include viral loop referral token
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setIsCreatingVoucher(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex justify-center items-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-slate-700">Loading gift item...</span>
      </div>
    );
  }

  if (error || !giftItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex flex-col justify-center items-center text-center py-12">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-300">
          <span className="text-orange-500 text-2xl">☕</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-700 mb-4" style={{fontFamily: 'Alegreya SC, serif'}}>Gift Item Not Found</h1>
        <p className="text-slate-600 mb-6">{error || 'The requested gift item could not be found.'}</p>
        <Link href="/" className="bg-orange-600 text-white font-bold px-6 py-3 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-orange-500">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100">
      <div className="flex justify-center">
              <Image
                src="/brontie-logo.webp"
                alt="Brontie Logo"
                width={400}
                height={160}
                className="object-contain"
              />
            </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-orange-100">
        <div className="md:flex">
          {/* Gift Item Image */}
          <div className="md:w-1/2">
            {giftItem.imageUrl ? (
              <div className="h-96 relative">
                <Image
                  src={giftItem.imageUrl}
                  alt={giftItem.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-96 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-lg">No Image Available</span>
              </div>
            )}
          </div>

          {/* Gift Item Details */}
          <div className="md:w-1/2 p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-700 mb-2" style={{fontFamily: 'Alegreya SC, serif'}}>{giftItem.name}</h1>
              {giftItem.description && (
                <p className="text-slate-600 mb-4">{giftItem.description}</p>
              )}
              <div className="text-3xl font-bold text-orange-600 mb-4 animate-gentle-pulse">
                €{giftItem.price.toFixed(2)}
              </div>
            </div>

            {/* Merchant Info */}
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
              <h3 className="font-semibold text-slate-700 mb-2">Available at:</h3>
              <div className="flex items-center space-x-3 mb-3">
                {giftItem.merchantId.logoUrl && (
                  <Image
                    src={giftItem.merchantId.logoUrl}
                    alt={giftItem.merchantId.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="font-medium text-slate-700">{giftItem.merchantId.name}</span>
              </div>
              
              <div className="space-y-2">
                {giftItem.locationIds.map((location) => (
                  <div key={location._id} className="text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(location.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-terracotta hover:underline transition-colors"
                      >
                        {location.address}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="mb-6">
              <Link 
                href={`/products`}
                className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 transition-colors duration-300"
              >
                ← Back to 
              </Link>
            </div>

            {/* Purchase Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-700" style={{fontFamily: 'Alegreya SC, serif'}}>Send as Gift</h3>
              
              <div>
                <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="senderName"
                  name="senderName"
                  value={formData.senderName}
                  onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
                  placeholder="Enter your name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                />
              </div>

              <div>
                <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                  placeholder="Enter recipient's name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingVoucher}
                className="w-full bg-orange-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingVoucher ? 'Processing...' : `Purchase Gift - €${giftItem.price.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
      </div>
      
      {/* Call to Action - Final touch */}
      <section className="py-16 bg-gradient-to-r from-orange-100 via-yellow-100 to-green-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-700 mb-6" style={{fontFamily: 'Alegreya SC, serif'}}>
            Ready to brighten someone&rsquo;s day?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Every small gesture creates ripples of joy. Start with a simple gift and watch how it transforms an ordinary moment into something memorable.
          </p>
          <Link 
            href="/"
            className="inline-block bg-orange-600 !text-white font-bold px-8 py-3 rounded-full hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-orange-500"
          >
            Explore More Gifts
          </Link>
        </div>
      </section>
    </div>
  );
}
