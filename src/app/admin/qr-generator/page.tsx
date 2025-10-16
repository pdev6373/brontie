'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

interface Merchant {
  _id: string;
  name: string;
}

interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
  merchantId: string;
}

interface ExistingQRCode {
  id: string;
  shortId: string;
  merchantId: string;
  locationId: string;
  merchantName: string;
  locationName: string;
  locationAddress: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  qrUrl: string;
}

export default function QRGeneratorPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [locations, setLocations] = useState<MerchantLocation[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [qrCodeURL, setQrCodeURL] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingQRCodes, setExistingQRCodes] = useState<ExistingQRCode[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [existingQR, setExistingQR] = useState<ExistingQRCode | null>(null);
  const [showExistingList, setShowExistingList] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []);

  useEffect(() => {
    if (selectedMerchant) {
      fetchLocations(selectedMerchant);
      fetchExistingQRCodes(selectedMerchant);
    } else {
      setLocations([]);
      setSelectedLocation('');
      setExistingQRCodes([]);
    }
  }, [selectedMerchant]);

  useEffect(() => {
    if (selectedLocation) {
      checkExistingQRForLocation(selectedLocation);
    }
  }, [selectedLocation]);

  const fetchMerchants = async () => {
    try {
      const response = await fetch('/api/admin/merchants');
      if (response.ok) {
        const data = await response.json();
        setMerchants(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch merchants:', err);
    }
  };

  const fetchLocations = async (merchantId: string) => {
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}/locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const fetchExistingQRCodes = async (merchantId: string) => {
    try {
      const response = await fetch(`/api/admin/qr/list?merchantId=${merchantId}`);
      if (response.ok) {
        const data = await response.json();
        setExistingQRCodes(data.qrCodes || []);
      }
    } catch (err) {
      console.error('Failed to fetch existing QR codes:', err);
    }
  };

  const checkExistingQRForLocation = async (locationId: string) => {
    try {
      const response = await fetch(`/api/admin/qr/check-existing?locationId=${locationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasExisting) {
          setExistingQR(data.existingQR);
        } else {
          setExistingQR(null);
        }
      }
    } catch (err) {
      console.error('Failed to check existing QR code:', err);
    }
  };

  const generateQRCode = async () => {
    if (!selectedMerchant || !selectedLocation) {
      setError('Please select both merchant and location');
      return;
    }

    // Check if there's an existing QR code
    if (existingQR) {
      setShowConfirmation(true);
      return;
    }

    await performQRGeneration();
  };

  const performQRGeneration = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate encrypted QR data
      const response = await fetch('/api/admin/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: selectedMerchant,
          locationId: selectedLocation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          // Conflict - existing QR code
          setExistingQR(errorData.existingQR);
          setShowConfirmation(true);
          return;
        }
        throw new Error(errorData.error || 'Failed to generate QR code');
      }

      const data = await response.json();
      setQrCodeURL(data.qrUrl);

      // Generate QR code with logo overlay
      const qrDataURL = await generateQRWithLogo(data.qrUrl);
      setQrCodeDataURL(qrDataURL);

      // Refresh the existing QR codes list
      if (selectedMerchant) {
        fetchExistingQRCodes(selectedMerchant);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const regenerateQRCode = async () => {
    setLoading(true);
    setError(null);
    setShowConfirmation(false);

    try {
      // Regenerate QR code (deactivates old one)
      const response = await fetch('/api/admin/qr/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: selectedMerchant,
          locationId: selectedLocation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate QR code');
      }

      const data = await response.json();
      setQrCodeURL(data.qrUrl);

      // Generate QR code with logo overlay
      const qrDataURL = await generateQRWithLogo(data.qrUrl);
      setQrCodeDataURL(qrDataURL);

      // Refresh the existing QR codes list
      if (selectedMerchant) {
        fetchExistingQRCodes(selectedMerchant);
      }

      // Clear existing QR state
      setExistingQR(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate QR code');
    } finally {
      setLoading(false);
    }
  };

  const generateQRWithLogo = async (qrUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // First generate the base QR code with enhanced settings for better scanning
      QRCode.toDataURL(qrUrl, {
        width: 512, // Increased size for better scanning
        margin: 4,  // Larger quiet zone for better detection
        color: {
          dark: '#000000', // Pure black for maximum contrast
          light: '#ffffff'  // Pure white for maximum contrast
        },
        errorCorrectionLevel: 'H' // High error correction for logo overlay and better resilience
      }, (err, url) => {
        if (err) {
          reject(err);
          return;
        }

        // Create canvas for logo overlay
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const qrImage = new window.Image();
        qrImage.onload = () => {
          // Set canvas size to match QR code
          canvas.width = qrImage.width;
          canvas.height = qrImage.height;

          // Draw the QR code
          ctx.drawImage(qrImage, 0, 0);

          // Calculate logo size (smaller for better scanning - 15% instead of 25%)
          const logoSize = Math.min(canvas.width, canvas.height) * 0.15;
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = (canvas.height - logoSize) / 2;

          // Create white square background for logo with padding
          const padding = 8;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(logoX - padding, logoY - padding, logoSize + (padding * 2), logoSize + (padding * 2));

          // Add subtle border to the square background
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(logoX - padding, logoY - padding, logoSize + (padding * 2), logoSize + (padding * 2));

          // Draw the 'B' logo with better positioning
          ctx.fillStyle = '#d97706'; // amber-600
          ctx.font = `bold ${logoSize * 0.8}px serif`; // Smaller font for better fit
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('B', canvas.width / 2, canvas.height / 2);

          // Convert canvas to data URL
          resolve(canvas.toDataURL('image/png'));
        };

        qrImage.onerror = () => {
          reject(new Error('Failed to load QR code image'));
        };

        qrImage.src = url;
      });
    });
  };

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return;

    const selectedLocationData = locations.find(loc => loc._id === selectedLocation);
    const selectedMerchantData = merchants.find(m => m._id === selectedMerchant);
    
    const link = document.createElement('a');
    link.download = `qr-${selectedMerchantData?.name}-${selectedLocationData?.name}.png`.replace(/\s+/g, '-');
    link.href = qrCodeDataURL;
    link.click();
  };

  const downloadExistingQRCode = async (qrCode: ExistingQRCode) => {
    try {
      // Generate QR code with logo for the existing QR
      const qrDataURL = await generateQRWithLogo(qrCode.qrUrl);
      
      const link = document.createElement('a');
      link.download = `qr-${qrCode.merchantName}-${qrCode.locationName}.png`.replace(/\s+/g, '-');
      link.href = qrDataURL;
      link.click();
    } catch (err) {
      console.error('Failed to download existing QR code:', err);
      setError('Failed to download QR code');
    }
  };

  const selectedLocationData = locations.find(loc => loc._id === selectedLocation);
  const selectedMerchantData = merchants.find(m => m._id === selectedMerchant);

  return (
    <div className="min-h-screen bg-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              QR Code Generator
            </h1>
            
            <div className="space-y-6">
              {/* Merchant Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Merchant
                </label>
                <select
                  value={selectedMerchant}
                  onChange={(e) => setSelectedMerchant(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Choose a merchant...</option>
                  {merchants.map((merchant) => (
                    <option key={merchant._id} value={merchant._id}>
                      {merchant.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  disabled={!selectedMerchant}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
                >
                  <option value="">Choose a location...</option>
                  {locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name} - {location.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Existing QR Warning */}
              {existingQR && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Existing QR Code Found
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This location already has an active QR code:</p>
                        <p className="font-mono text-xs mt-1">ID: {existingQR.shortId}</p>
                        <p className="text-xs mt-1">Created: {new Date(existingQR.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={generateQRCode}
                disabled={!selectedMerchant || !selectedLocation || loading}
                className="w-full bg-amber-700 text-white py-3 px-6 rounded-lg hover:bg-amber-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Generating...' : existingQR ? 'Regenerate QR Code' : 'Generate QR Code'}
              </button>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* QR Code Display */}
              {qrCodeDataURL && (
                <div className="bg-amber-50 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Generated QR Code
                  </h3>
                  
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <Image 
                      src={qrCodeDataURL} 
                      alt="Generated QR Code" 
                      width={256}
                      height={256}
                      className="border border-amber-200"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <p><strong>Merchant:</strong> {selectedMerchantData?.name}</p>
                    <p><strong>Location:</strong> {selectedLocationData?.name}</p>
                    <p><strong>Address:</strong> {selectedLocationData?.address}</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={downloadQRCode}
                      className="bg-amber-700 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition-colors"
                    >
                      Download QR Code
                    </button>
                    
                    <div className="text-xs text-gray-500">
                      <p>QR URL: {qrCodeURL}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing QR Codes List */}
              {existingQRCodes.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">Existing QR Codes</h4>
                    <button
                      onClick={() => setShowExistingList(!showExistingList)}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                    >
                      {showExistingList ? 'Hide' : 'Show'} ({existingQRCodes.length})
                    </button>
                  </div>
                  
                  {showExistingList && (
                    <div className="space-y-3">
                      {existingQRCodes.map((qrCode) => (
                        <div key={qrCode.id} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{qrCode.locationName}</span>
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                  {qrCode.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{qrCode.locationAddress}</p>
                              <p className="text-xs text-gray-500 font-mono">ID: {qrCode.shortId}</p>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(qrCode.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => downloadExistingQRCode(qrCode)}
                              className="bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700 transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Select the merchant and location</li>
                  <li>2. Generate the QR code</li>
                  <li>3. Download and print the QR code</li>
                  <li>4. Place the printed QR code at the merchant location</li>
                  <li>5. Customers will scan this code to redeem vouchers</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && existingQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Override Existing QR Code?</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                This location already has an active QR code. Generating a new one will deactivate the current QR code.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">Current QR Code:</p>
                <p className="text-xs text-gray-600 font-mono">ID: {existingQR.shortId}</p>
                <p className="text-xs text-gray-600">
                  Created: {new Date(existingQR.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-600">
                  Expires: {new Date(existingQR.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={regenerateQRCode}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Regenerating...' : 'Override & Generate New'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
