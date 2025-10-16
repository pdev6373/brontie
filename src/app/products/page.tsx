import AvailableGiftsFromBackend from '@/components/pages/how-it-works/AvailableGiftsFromBackend';
import GiftCategorySection from '@/components/pages/how-it-works/GiftCategorySection';
import HowItWorksBanner from '@/components/pages/how-it-works/HowItWorksBanner';
import CountyFilter from '@/components/pages/how-it-works/CountyFilter';
import Image from 'next/image';
import Link from 'next/link';
import React, { Suspense } from 'react'
import { Lobster } from 'next/font/google';

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
});

async function getMerchants() {
  try {
    const [merchantsRes, itemsRes] = await Promise.all([
      fetch('/api/admin/merchants', { cache: 'no-store' }),
      fetch('/api/gift-items', { cache: 'no-store' })
    ]);
    if (!merchantsRes.ok) return [] as { _id: string; name: string; status?: string; isActive?: boolean; county?: string; createdAt?: string }[];
    const [merchantsJson, itemsJson] = await Promise.all([merchantsRes.json(), itemsRes.ok ? itemsRes.json() : Promise.resolve({ giftItems: [] })]);
    const merchants = (merchantsJson.data || merchantsJson.merchants || []) as { _id: string; name: string; status?: string; isActive?: boolean; county?: string; createdAt?: string }[];
    const items = (itemsJson.giftItems || []) as Array<{ merchantId: { _id: string } }>;
    const merchantHasItem = new Set(items.map(i => i.merchantId?._id).filter(Boolean));
    
    // Filter and sort merchants
    const filteredMerchants = merchants
      .filter(m => (m.status ? m.status === 'approved' : true) && (m.isActive ?? true))
      .filter(m => merchantHasItem.has(m._id));
    
    // Sort by signup date with W&W first (assuming they have "Willow" or "Wild" in name)
    return filteredMerchants.sort((a, b) => {
      // Check if either is Willow & Wild (case insensitive)
      const aIsWW = a.name.toLowerCase().includes('willow') || a.name.toLowerCase().includes('wild');
      const bIsWW = b.name.toLowerCase().includes('willow') || b.name.toLowerCase().includes('wild');
      
      // If one is W&W and the other isn't, W&W comes first
      if (aIsWW && !bIsWW) return -1;
      if (!aIsWW && bIsWW) return 1;
      
      // If both are W&W or neither are, sort by creation date (oldest first)
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return aDate.getTime() - bDate.getTime();
    });
  } catch {
    return [] as { _id: string; name: string }[];
  }
}

const HowItWorksPage = async () => {
  const merchants = await getMerchants();
  return (
    <div className={`${lobster.variable} main-wrapper-how-it-works-page`}>
      <div className="how-it-work-top-box relative">
        <HowItWorksBanner />
        <div className="blobs-wrapper-box relative">
          {/* County Filter and Merchants */}
          <Suspense fallback={<div className="custom-container mt-6"><div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-full p-4 mb-4"><div className="text-center text-amber-800">Loading counties...</div></div></div>}>
            <CountyFilter merchants={merchants} />
          </Suspense>
          
          <GiftCategorySection />
          <Suspense fallback={
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
          }>
            <AvailableGiftsFromBackend />
          </Suspense>
        </div>
        <div className="custom-container">
          {/* =================== */}
          <div className="site-cts-wrapper-area mt-16 md:mt-20 xl:mt-[129px] -mb-[180px] md:-mb-[160px] lg:-mb-[220px] xl:-mb-[318px] relative z-[999] grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16 lg:gap-20 pt-[30px] md:pt-[47px] pr-[11px] md:pr-10 lg:pr-[56px] pb-[27px] md:pb-[34px] pl-0 md:pl-14 lg:pl-[77px] rounded-[22px]">
            <div className="site-cta-left-cont flex flex-col justify-center items-start pl-[26px] md:pl-0">
              <h2 className="title text-left text-[34px] lg:text-[46px] xl:text-[60px] text-mono-0 font-normal font-primary leading-[120%] max-w-[553px]">
                &quot;Brighten someone&apos;s day. Gift a Brontie today.&quot;
              </h2>
              <div className="button-item relative mt-8 md:mt-9 lg:mt-[50px]">
                <Link
                  className="bg-secondary-100 hover:opacity-85 flex relative z-[9] h-[49px] md:h-[60px] lg:h-[79px] items-center max-w-[305px] w-full justify-center py-4 md:py-5 xl:py-[27px] pl-[35px] pr-[19px] rounded-[11px] text-[12px] md:text-[18px] lg:text-[22px] text-center font-secondary font-normal leading-[1]"
                  href="/products"
                >
                  Gift a Brontie today →
                </Link>
                <Image
                  src="/images/icons/shadow-elisp.svg"
                  width={233}
                  height={41}
                  alt="angle arrow model"
                  className="absolute -bottom-[45px] -left-[26px] right-0 mx-auto"
                />
              </div>
            </div>
            <div className="site-cta-right-cont ">
              <Image
                src="/images/cta-section-model.png"
                alt="cta model image"
                width={626}
                height={480}
              />
            </div>
          </div>
          {/* ====================== */}
        </div>
      </div>
    </div>
  );
}

export default HowItWorksPage
