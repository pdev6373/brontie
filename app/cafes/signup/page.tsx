'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MerchantFormData {
  name: string;
  address: string;
  county: string;
  description: string;
  businessEmail: string;
  contactPhone: string;
  website: string;
  logoUrl: string;
  businessCategory: 'Café & Treats' | 'Tickets & Passes' | 'Dining & Meals' | 'Other';
}

interface GiftItem {
  name: string;
  categoryId: string;
  price: number;
  description: string;
  imageUrl: string;
}



export default function CafeSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [merchantData, setMerchantData] = useState<MerchantFormData>({
    name: '',
    address: '',
    county: '',
    description: '',
    businessEmail: '',
    contactPhone: '',
    website: '',
    logoUrl: '',
    businessCategory: 'Café & Treats'
  });
  const [giftItems, setGiftItems] = useState<GiftItem[]>([
    {
      name: '',
      categoryId: '',
      price: 0.50,
      description: '',
      imageUrl: ''
    }
  ]);
  const [confirmEmail, setConfirmEmail] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [itemFiles, setItemFiles] = useState<(File | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!merchantData.name.trim()) {
      newErrors.name = 'Café name is required';
    }
    
    if (!merchantData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!merchantData.county.trim()) {
      newErrors.county = 'County is required';
    }
    
    if (!merchantData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (merchantData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }
    
    if (!merchantData.businessEmail.trim()) {
      newErrors.email = 'Business email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(merchantData.businessEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!confirmEmail.trim()) {
      newErrors.confirmEmail = 'Please confirm your email address';
    } else if (confirmEmail !== merchantData.businessEmail) {
      newErrors.confirmEmail = 'Email addresses do not match';
    }
    
    if (merchantData.website && !/^https?:\/\/.+/.test(merchantData.website)) {
      newErrors.website = 'Please enter a valid URL starting with http:// or https://';
    }
    
    // Logo is now optional - no validation needed
    
    if (!merchantData.businessCategory) {
      newErrors.businessCategory = 'Business category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Products are now optional - validation is not required
    // Users can skip adding products and add them later
    
    // If items are provided, validate them, but it's not required
    let validItemsCount = 0;
    
    for (let i = 0; i < giftItems.length; i++) {
      const item = giftItems[i];
      
      // Only validate if the item has some content
      if (item.name.trim() || item.categoryId || item.price > 0 || item.description.trim() || itemFiles[i] || item.imageUrl) {
        let itemValid = true;
        
        if (!item.name.trim()) {
          newErrors[`item${i}Name`] = 'Item name is required';
          itemValid = false;
        }
        if (!item.categoryId) {
          newErrors[`item${i}Category`] = 'Category is required';
          itemValid = false;
        }
        if (item.price < 0.50) {
          newErrors[`item${i}Price`] = 'Price must be at least €0.50';
          itemValid = false;
        }
        if (item.description.length > 200) {
          newErrors[`item${i}Description`] = 'Description must be 200 characters or less';
          itemValid = false;
        }
        if (!itemFiles[i] && !item.imageUrl) {
          newErrors[`item${i}Image`] = 'Product image is required';
          itemValid = false;
        }
        
        if (itemValid) {
          validItemsCount++;
        }
      }
    }
    
    setErrors(newErrors);
    // Always return true since products are optional
    return true;
  };



  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      default:
        isValid = true;
    }
    
    console.log(`Step ${currentStep} validation:`, isValid);
    
    if (isValid) {
      if (currentStep === 2) {
        // Step 2 is the final step - submit the application
        handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setMerchantData(prev => ({ ...prev, logoUrl: data.url }));
        setLogoFile(file);
      } else {
        console.error('Failed to upload logo');
      }
    } catch {
      console.error('Error uploading logo');
    }
  };

  const handleItemImageUpload = async (file: File, index: number) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setGiftItems(prev => prev.map((item, i) => 
          i === index ? { ...item, imageUrl: data.url } : item
        ));
        setItemFiles(prev => prev.map((f, i) => i === index ? file : f));
      } else {
        console.error('Failed to upload item image');
      }
    } catch (error) {
      console.error('Error uploading item image:', error);
    }
  };

  const addGiftItem = () => {
    if (giftItems.length < 15) {
      setGiftItems(prev => [...prev, {
        name: '',
        categoryId: '',
        price: 0.50,
        description: '',
        imageUrl: ''
      }]);
      setItemFiles(prev => [...prev, null]);
    }
  };

  const removeGiftItem = (index: number) => {
    if (giftItems.length > 1) {
      setGiftItems(prev => prev.filter((_, i) => i !== index));
      setItemFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/cafes/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant: merchantData,
          giftItems: giftItems.filter(item => item.name.trim() && item.imageUrl)
          // Note: payout details are not included in initial signup
          // Note: giftItems can be empty array if user skips adding products
        }),
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to submit application' });
      }
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Thanks! Your application is pending
          </h1>
          <p className="text-gray-600 mb-6">
            We&apos;ll review your café and gift items now. You&apos;ll hear back within 24 hours.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Join Brontie as a Business
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Share your products and services with customers and unlock a new e-gift revenue stream for your business
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-12">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                currentStep >= step 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? '✓' : step}
              </div>
              {step < 2 && (
                <div className={`w-16 h-1 mx-4 ${
                  currentStep > step ? 'bg-teal-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Business Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={merchantData.name}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your business name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Category *
                  </label>
                  <select
                    value={merchantData.businessCategory}
                    onChange={(e) => setMerchantData(prev => ({ 
                      ...prev, 
                      businessCategory: e.target.value as MerchantFormData['businessCategory']
                    }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                      errors.businessCategory ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="Café & Treats">☕ Café & Treats</option>
                    <option value="Tickets & Passes">🎫 Tickets & Passes</option>
                    <option value="Dining & Meals">🍽️ Dining & Meals</option>
                    <option value="Other">🔧 Other</option>
                  </select>
                  {errors.businessCategory && <p className="text-red-500 text-sm mt-1">{errors.businessCategory}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Select the category that best describes your business type
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Cafe Address *
                  </label>
                  <textarea
                    value={merchantData.address}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, address: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full address"
                    rows={3}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    County *
                  </label>
                  <select
                    value={merchantData.county}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, county: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                      errors.county ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select County</option>
                    <option value="Carlow">Carlow</option>
                    <option value="Cavan">Cavan</option>
                    <option value="Clare">Clare</option>
                    <option value="Cork">Cork</option>
                    <option value="Donegal">Donegal</option>
                    <option value="Dublin">Dublin</option>
                    <option value="Galway">Galway</option>
                    <option value="Kerry">Kerry</option>
                    <option value="Kildare">Kildare</option>
                    <option value="Kilkenny">Kilkenny</option>
                    <option value="Laois">Laois</option>
                    <option value="Leitrim">Leitrim</option>
                    <option value="Limerick">Limerick</option>
                    <option value="Longford">Longford</option>
                    <option value="Louth">Louth</option>
                    <option value="Mayo">Mayo</option>
                    <option value="Meath">Meath</option>
                    <option value="Monaghan">Monaghan</option>
                    <option value="Offaly">Offaly</option>
                    <option value="Roscommon">Roscommon</option>
                    <option value="Sligo">Sligo</option>
                    <option value="Tipperary">Tipperary</option>
                    <option value="Waterford">Waterford</option>
                    <option value="Westmeath">Westmeath</option>
                    <option value="Wexford">Wexford</option>
                    <option value="Wicklow">Wicklow</option>
                  </select>
                  {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description * (max 500 characters)
                  </label>
                  <textarea
                    value={merchantData.description}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Tell customers about your café, atmosphere, and specialties"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{errors.description && <span className="text-red-500">{errors.description}</span>}</span>
                    <span>{merchantData.description.length}/500</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      value={merchantData.businessEmail}
                      onChange={(e) => setMerchantData(prev => ({ ...prev, businessEmail: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Email *
                    </label>
                    <input
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                        errors.confirmEmail ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.confirmEmail && <p className="text-red-500 text-sm mt-1">{errors.confirmEmail}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={merchantData.contactPhone}
                      onChange={(e) => setMerchantData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                      placeholder="+353 1 234 5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    value={merchantData.website}
                    onChange={(e) => setMerchantData(prev => ({ ...prev, website: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                      errors.website ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="https://yourcafe.com"
                  />
                  {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo (Can add later)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setErrors(prev => ({ ...prev, logo: 'File size must be 5MB or less' }));
                            return;
                          }
                          handleLogoUpload(file);
                        }
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {merchantData.logoUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={merchantData.logoUrl} 
                            alt="Logo preview" 
                            className="w-20 h-20 object-cover rounded-lg mx-auto"
                          />
                          <p className="text-sm text-gray-600">Click to change logo</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                            <span className="text-gray-400 text-2xl">📷</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="text-teal-600 font-medium">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">JPG, PNG, or WebP • Max 5MB • 1:1 or 4:3 recommended</p>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.logo && <p className="text-red-500 text-sm mt-1">{errors.logo}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 2. Add Products (Optional)</h2>
              <p className="text-gray-600 mb-4">You can add your products now or add them later. Either way, you&apos;re almost done with your signup!</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>You can list up to 15 items on Brontie.</strong> Feel free to combine items, such as &quot;Coffee&quot; (Americano/Latte/Cappuccino) or &quot;Pastries&quot; (Croissant/Muffin/Scone).
                </p>
              </div>
              
              <div className="space-y-6">
                {giftItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Item {index + 1}</h3>
                      {giftItems.length > 3 && (
                        <button
                          type="button"
                          onClick={() => removeGiftItem(index)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Name *
                        </label>
                                                 <input
                           type="text"
                           value={item.name}
                           onChange={(e) => setGiftItems(prev => prev.map((i, idx) => 
                             idx === index ? { ...i, name: e.target.value } : i
                           ))}
                           className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                             errors[`item${index}Name`] ? 'border-red-300' : 'border-gray-300'
                           }`}
                           placeholder="e.g., Cappuccino, Chocolate Croissant"
                         />
                        {errors[`item${index}Name`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`item${index}Name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                                                 <select
                           value={item.categoryId}
                           onChange={(e) => setGiftItems(prev => prev.map((i, idx) => 
                             idx === index ? { ...i, categoryId: e.target.value } : i
                           ))}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                         >
                          <option value="">Select Category</option>
                          <option value="68483ef21d38b4b7195d45cd">Cafés & Treats</option>
                          <option value="68483ef21d38b4b7195d45ce">Tickets & Passes</option>
                          <option value="68492e4c7c523741d619abeb">Dining & Meals</option>
                        </select>
                        {errors[`item${index}Category`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`item${index}Category`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price € *
                        </label>
                                                 <input
                           type="number"
                           value={item.price}
                           onChange={(e) => setGiftItems(prev => prev.map((i, idx) => 
                             idx === index ? { ...i, price: parseFloat(e.target.value) || 0 } : i
                           ))}
                           min="0.50"
                           step="0.10"
                           className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                             errors[`item${index}Price`] ? 'border-red-300' : 'border-gray-300'
                           }`}
                         />
                        {errors[`item${index}Price`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`item${index}Price`]}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Minimum €0.50, increments of €0.10</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Image *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-teal-400 transition-colors">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  setErrors(prev => ({ ...prev, [`item${index}Image`]: 'File size must be 5MB or less' }));
                                  return;
                                }
                                handleItemImageUpload(file, index);
                              }
                            }}
                            className="hidden"
                            id={`item-image-${index}`}
                          />
                          <label htmlFor={`item-image-${index}`} className="cursor-pointer">
                            {item.imageUrl ? (
                              <div className="space-y-2">
                                <img 
                                  src={item.imageUrl} 
                                  alt={`${item.name} preview`} 
                                  className="w-16 h-16 object-cover rounded-md mx-auto"
                                />
                                <p className="text-xs text-gray-600">Click to change</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="w-16 h-16 bg-gray-100 rounded-md mx-auto flex items-center justify-center">
                                  <span className="text-gray-400 text-lg">📷</span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  <span className="text-teal-600 font-medium">Click to upload</span>
                                </p>
                                <p className="text-xs text-gray-500">JPG, PNG, or WebP • Max 5MB</p>
                              </div>
                            )}
                          </label>
                        </div>
                        {errors[`item${index}Image`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`item${index}Image`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (optional, max 200 characters)
                      </label>
                                             <textarea
                         value={item.description}
                         onChange={(e) => setGiftItems(prev => prev.map((i, idx) => 
                           idx === index ? { ...i, description: e.target.value } : i
                         ))}
                         className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black ${
                           errors[`item${index}Description`] ? 'border-red-300' : 'border-gray-300'
                         }`}
                         placeholder="Brief description of this item..."
                         rows={2}
                         maxLength={200}
                       />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{errors[`item${index}Description`] && (
                          <span className="text-red-500">{errors[`item${index}Description`]}</span>
                        )}</span>
                        <span>{item.description.length}/200</span>
                      </div>
                    </div>
                  </div>
                ))}

                {giftItems.length < 15 && (
                  <button
                    type="button"
                    onClick={addGiftItem}
                    className="w-full border-2 border-dashed border-teal-300 rounded-lg p-6 text-teal-600 hover:border-teal-400 hover:bg-teal-50 transition-colors"
                  >
                    <span className="text-lg font-medium">+ Add Another Gift Item</span>
                    <p className="text-sm text-teal-500 mt-1">You can add up to 15 items total</p>
                  </button>
                )}

                {errors.items && <p className="text-red-500 text-sm text-center">{errors.items}</p>}
                
                {/* Add products later option */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Don&apos;t have time right now?</h3>
                  <p className="text-gray-600 mb-4">No problem! You can add your products after your account is approved.</p>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Add products later'}
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-teal-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-yellow-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
