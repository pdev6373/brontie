'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  trackQRNavigationToProducts, 
  trackGiftPurchaseIntent, 
  trackMerchantTabChanged, 
  trackCountyFilterChanged, 
  trackShowAllToggled 
} from '@/lib/posthog-tracking';

interface Merchant {
  _id: string;
  name: string;
  logoUrl?: string;
  county: string;
}

interface MerchantLocation {
  _id: string;
  name: string;
  address: string;
  county: string;
}

interface GiftItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  merchantId: Merchant;
  locationIds: MerchantLocation[];
}

// Dynamic categories built from backend data

export default function AvailableGiftsFromBackend() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('All Items');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [showAll, setShowAll] = useState(false);
  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Items']);
  const [availableCounties, setAvailableCounties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Animated underline state ---
  const ulRef = useRef<HTMLUListElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const [underline, setUnderline] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const recalcUnderline = () => {
    const ul = ulRef.current;
    const li = tabRefs.current[activeTab];
    if (!ul || !li) return;
    const ulBox = ul.getBoundingClientRect();
    const liBox = li.getBoundingClientRect();
    setUnderline({ left: liBox.left - ulBox.left, width: liBox.width });
  };

  // Fetch gift items from backend
  useEffect(() => {
    const fetchGiftItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/gift-items');
        if (!response.ok) {
          throw new Error('Failed to fetch gift items');
        }
        const data = await response.json();
        if (data.success) {
          setGiftItems(data.giftItems);
        } else {
          throw new Error(data.error || 'Failed to fetch gift items');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGiftItems();
  }, []);

  // Handle URL parameters for automatic merchant selection
  useEffect(() => {
    const merchantId = searchParams.get('merchant');
    const locationId = searchParams.get('location');
    
    if (merchantId && giftItems.length > 0) {
      // Find the merchant by ID
      const merchant = giftItems.find(item => item.merchantId._id === merchantId);
      if (merchant) {
        setActiveTab(merchant.merchantId.name);
        
        // Track navigation from QR code with PostHog
        trackQRNavigationToProducts({
          merchant_id: merchantId,
          merchant_name: merchant.merchantId.name,
          location_id: locationId,
          source: 'qr_code'
        });
      }
    }
  }, [searchParams, giftItems]);

  // Montar tabs apenas com cafés que realmente têm produtos (considerando filtro de condado)
  useEffect(() => {
    let filteredItems = giftItems;
    
    // Se um condado está selecionado, filtrar apenas merchants que têm localizações nesse condado
    // ou que o próprio merchant está nesse condado
    if (selectedCounty) {
      filteredItems = filteredItems.filter(item => 
        item.merchantId.county === selectedCounty ||
        item.locationIds.some(location => location.county === selectedCounty)
      );
    }
    
    const names = Array.from(new Set(
      filteredItems
        .map(g => g.merchantId?.name)
        .filter((n): n is string => Boolean(n))
    ));
    const newCategories = ['All Items', ...names.sort((a, b) => a.localeCompare(b))];
    setCategories(newCategories);
    
    // Se a tab ativa não está mais disponível, resetar para "All Items"
    if (activeTab !== 'All Items' && !newCategories.includes(activeTab)) {
      setActiveTab('All Items');
    }
  }, [giftItems, selectedCounty, activeTab]);

  // Extrair condados disponíveis dos merchants e das localizações dos gift items
  useEffect(() => {
    const merchantCounties = giftItems
      .map(g => g.merchantId?.county)
      .filter((c): c is string => Boolean(c));
    
    const locationCounties = giftItems
      .flatMap(g => g.locationIds?.map(l => l.county))
      .filter((c): c is string => Boolean(c));
    
    // Combinar counties de merchants e locations, removendo duplicatas
    const allCounties = Array.from(new Set([...merchantCounties, ...locationCounties]));
    setAvailableCounties(allCounties.sort((a, b) => a.localeCompare(b)));
  }, [giftItems]);

  // position underline on mount and whenever active tab changes / window resizes
  useEffect(() => {
    recalcUnderline();
    const onResize = () => recalcUnderline();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, categories.length]);

  // ensure underline is correct on first paint
  useEffect(() => {
    recalcUnderline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered: GiftItem[] = useMemo(() => {
    let filteredItems = giftItems;

    // Filter by county if selected (using both merchant and location counties)
    if (selectedCounty) {
      filteredItems = filteredItems.filter(item => 
        item.merchantId.county === selectedCounty || 
        item.locationIds.some(location => location.county === selectedCounty)
      );
    }

    // Filter by tab (merchant)
    const byTab = activeTab === 'All Items'
      ? filteredItems
      : filteredItems.filter(item => item.merchantId.name === activeTab);

    // Order by creation for "All Items"
    if (activeTab === 'All Items') {
      return [...byTab].sort((a: any, b: any) => {
        const da = new Date((a as any).createdAt ?? 0).getTime();
        const db = new Date((b as any).createdAt ?? 0).getTime();
        return da - db; // oldest first
      });
    }
    return byTab;
  }, [giftItems, activeTab, selectedCounty]);

  const visible = showAll ? filtered : filtered.slice(0, 3);

  if (loading) {
    return (
      <section className="available-gifts-section">
        <div className="available-gift-wrapper relative pt-16 lg:pt-20 xl:pt-[130px] pb-[85px]">
          <div className="custom-container">
            <div className="section-cont relative z-[99] mb-5">
              <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-center text-mono-100 font-normal font-primary leading-[100%]">
                Available Gifts
              </h2>
            </div>
            <div className="flex justify-center items-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-slate-700">Loading gifts...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="available-gifts-section">
        <div className="available-gift-wrapper relative pt-16 lg:pt-20 xl:pt-[130px] pb-[85px]">
          <div className="custom-container">
            <div className="section-cont relative z-[99] mb-5">
              <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-center text-mono-100 font-normal font-primary leading-[100%]">
                Available Gifts
              </h2>
            </div>
            <div className="text-center py-20">
              <p className="text-red-600">Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-orange-600 text-white px-4 py-2 rounded"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="available-gifts-section">
      <div className="available-gift-wrapper relative  pt-16 lg:pt-20 xl:pt-[130px] pb-[85px]">
        <div className="custom-container">
          <div className="section-cont relative z-[99] mb-5">
            <h2 className="title text-[35px] md:text-[48px] lg:text-[56px] xl:text-[67px] text-center text-mono-100 font-normal font-primary leading-[100%]">
              Available Gifts
            </h2>
            
            {/* County Filter */}
            {availableCounties.length > 0 && (
              <div className="mt-6 flex justify-center">
                <div className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-full p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-amber-800 font-medium text-sm md:text-base">Filter by County:</span>
                    <select
                      value={selectedCounty}
                      onChange={(e) => {
                        setSelectedCounty(e.target.value);
                        setShowAll(false);
                        
                        // Track county filter change with PostHog
                        trackCountyFilterChanged({
                          selected_county: e.target.value,
                          active_tab: activeTab,
                          total_gifts: filtered.length
                        });
                      }}
                      className="px-4 py-2 border border-amber-300 rounded-2xl bg-white text-amber-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm md:text-base"
                    >
                      <option value="">All Counties</option>
                      {availableCounties.map(county => (
                        <option key={county} value={county}>
                          {county}
                        </option>
                      ))}
                    </select>
                    
                    {selectedCounty && (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-700 text-sm">
                          {filtered.length} gift{filtered.length !== 1 ? 's' : ''} in {selectedCounty}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedCounty('');
                            setShowAll(false);
                          }}
                          className="text-amber-600 hover:text-amber-800 text-sm underline"
                        >
                          Clear filter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="available-gifts--box relative z-[99]">
            {/* TABS */}
            <div className="relative max-w-[550px] mx-auto w-full">
              <ul
                ref={ulRef}
                className="available-category-filter-tabs mb-8 md:mb-8 lg:mb-8 xl:mb-[46px] flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 justify-stretch md:justify-center w-full max-w-[550px] mx-auto "
              >
                {categories.map((cat, idx) => {
                  const isActive = activeTab === cat;
                  return (
                    <li
                      key={cat}
                      ref={el => { tabRefs.current[cat] = el; }}
                      onClick={() => {
                        setActiveTab(cat);
                        setShowAll(false);
                        
                        // Track tab change with PostHog
                        trackMerchantTabChanged({
                          tab_name: cat,
                          selected_county: selectedCounty,
                          total_gifts: filtered.length
                        });
                      }}
                      role="tab"
                      aria-selected={isActive}
                      className={[
                        'filter-tabs-items',
                        'w-full md:w-auto',
                        'px-4 md:pl-[50px] md:pr-[68px]',
                        'py-3 md:pb-[12px] md:pt-[12px]',
                        'text-left md:text-center',
                        'cursor-pointer',
                        'hover:text-primary-100',
                        'transition-all ease-in drop-shadow-blue-600',
                        'border-b-[5px]',
                        // on mobile show blue underline for active, yellow for others
                        isActive ? 'border-b-primary-100' : 'border-b-[#f4c16f88] md:border-b-[#f4c16f88]',
                        'text-[16px] lg:text-[19px] font-normal font-secondary',
                        isActive ? 'text-primary-100' : 'text-mono-100',
                      ].join(' ')}
                    >
                      <span className="block max-w-[180px] truncate">{cat}</span>
                    </li>
                  );
                })}
              </ul>

              {/* Animated underline (SVG line) */}
              <AnimatePresence>
                <motion.div
                  key={activeTab}
                  className="absolute bottom-[5px] left-0 pointer-events-none hidden md:block"
                  initial={{
                    x: underline.left,
                    width: underline.width,
                    opacity: 0,
                  }}
                  animate={{
                    x: underline.left,
                    width: underline.width,
                    opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  style={{ height: 0 }}
                >
                  <svg
                    width="100%"
                    height="6"
                    viewBox="0 0 100 6"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0"
                      y1="3"
                      x2="100"
                      y2="3"
                      stroke="#6CA3A4"
                      strokeWidth="3"
                    />
                  </svg>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* CARDS — Masonry */}
            {filtered.length > 0 ? (
              <motion.div
                layout
                className={`available-gifts-card-main-box ${
                  filtered.length > 3
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-10'
                    : 'columns-1 md:columns-2 lg:columns-3 [column-gap:1rem] lg:[column-gap:1.5rem] xl:[column-gap:2.5rem]'
                }`}
              >
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map(item => (
                  <motion.div
                    layout
                    key={item._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className={`mb-[33px] ${filtered.length > 3 ? '' : 'break-inside-avoid'}`}
                  >
                    <div className="category-product-card-item rounded-[16px] px-[13px] lg:px-[19px] pb-[18px] lg:pb-[24px] pt-[13px] lg:pt-[18px] bg-mono-0">
                      <div className="p-card-head overflow-hidden w-full max-w-[387px]  max-h-[324px] rounded-[12px]">
                        <Image
                          src={item.imageUrl || '/images/product-card-image1.png'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          width={387}
                          height={324}
                        />
                      </div>
                      <div className="p-card-body mt-4 md:mt-5 xl:mt-[26px]">
                        <h3 className="p-title text-[21px] md:text-[24px] lg:text-[30px] text-left text-mono-100 font-normal font-primary leading-[120%]">
                          {item.name}
                        </h3>
                        
                        <div className="desc-box mt-[7px] flex items-center gap-2 justify-between">
                          <p className="text-[#282828] text-[12px] font-normal leading-[20px] font-secondary">
                            {item.description || 'Delicious gift item'}
                          </p>
                          {/*
                          <p className="preview-stars flex items-center gap-1 text-[11x] md:text-[14px]">
                            <Image
                              src="/images/icons/stars.svg"
                              alt="stars"
                              width={18}
                              height={18}
                              className="w-3 md:w-[18px]"
                            />
                            4.8/<span>5</span>
                          </p>
                          */}
                        </div>
                        <p className="p-price mt-3 lg:mt-[20px] block font-bold font-secondary text-left text-[24px] md:text-[26px]lg:text-[32px] text-mono-100 leading-[120%]">
                          €{item.price.toFixed(2)}
                        </p>

                        <div className="info-product-box mt-3 lg:mt-[20px] px-[13px] pt-[9px] pb-[18px] rounded-[12px]  border border-[#F4C24D] bg-[#F4C24D2E] ">
                          <p className="info-vendor flex items-center gap-[8px]">
                            {item.merchantId.logoUrl ? (
                              <Image
                                src={item.merchantId.logoUrl}
                                alt="vendor logo"
                                width={23}
                                height={23}
                              />
                            ) : (
                              <Image
                                src="/images/icons/vendor-small-logo.svg"
                                alt="vendor logo image"
                                width={23}
                                height={23}
                              />
                            )}
                            <span className="text-[#6CA3A4] text-left text-[12px] font-secondary font-normal leading-[100%]">
                              {item.merchantId.name}
                            </span>
                          </p>
                          <ul className="location-list mr-2 lg:mt-3 flex flex-col  gap-2 lg:gap-4 pl-0 lg:pl-6">
                            {item.locationIds.map((location) => (
                              <li
                                key={location._id}
                                className="locations flex items-center gap-2"
                              >
                                <Image
                                  src="/images/icons/ep_location.svg"
                                  alt="location icon"
                                  width={16}
                                  height={16}
                                />
                                <p className="text-mono-100  text-left text-[11px] md:text-[12px] font-secondary font-normal leading-[100%]">
                                  {location.address}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Link
                          href={`/product/${item._id}`}
                          onClick={() => {
                        // Track gift purchase intent with PostHog
                        trackGiftPurchaseIntent({
                          gift_item_id: item._id,
                          gift_name: item.name,
                          gift_price: item.price,
                          merchant_id: item.merchantId._id,
                          merchant_name: item.merchantId.name,
                          location_ids: item.locationIds.map(l => l._id),
                          location_names: item.locationIds.map(l => l.name),
                          active_tab: activeTab,
                          selected_county: selectedCounty
                        });
                          }}
                          className="hover:opacity-85 rounded-[9px] lg:rounded-[13px]  py-3 h-[46px] lg:h-[57px] max-w-[333px] mx-auto bg-secondary-100 w-full flex items-center mt-[20px] justify-center text-[15px] text-center text-mono-100 font-normal font-secondary leading-[100%] px-[21px]"
                        >
                          Purchase Gift →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <p className="text-amber-700 text-lg">
                  {selectedCounty ? `No gifts found in ${selectedCounty}` : 'No gifts available'}
                </p>
                {selectedCounty && (
                  <button
                    onClick={() => {
                      setSelectedCounty('');
                      setShowAll(false);
                    }}
                    className="mt-4 bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Clear county filter
                  </button>
                )}
              </div>
            )}

            {/* See all / Show less */}
            {filtered.length > 3 && (
              <button
                type="button"
                onClick={() => {
                  setShowAll(s => !s);
                  
                  // Track show all/show less with PostHog
                  trackShowAllToggled({
                    show_all: !showAll,
                    active_tab: activeTab,
                    selected_county: selectedCounty,
                    total_gifts: filtered.length
                  });
                }}
                className="rounded-[13px] hover:bg-secondary-100 h-[55px] max-w-[200px] mx-auto bg-transparent border border-secondary-100 w-full flex items-center mt-[28px] justify-center text-[15px] text-center text-mono-100 font-normal font-secondary leading-[100%] px-[21px]"
              >
                {showAll ? 'Show less' : 'See all'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
