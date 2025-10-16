'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

const COLORS = {
  yellow: "#FFC857", // Brontie warm yellow
  teal: "#72A7AB", // Brontie teal
  ink: "#2E2A27",
  cream: "#FFF7F0"
};

export default function BusinessCardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const hasTrackedRef = useRef(false);
  const posthog = usePostHog();

  useEffect(() => {
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const properties: Record<string, unknown> = {
        page: 'business-card',
        path: window.location.pathname,
        referrer: document.referrer || undefined,
      };

      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
      utmKeys.forEach((key) => {
        const value = urlParams.get(key);
        if (value) properties[key] = value;
      });

      if (posthog) {
        posthog.capture('business_card_qr_scan', properties);
      }
    } catch (err) {
      console.warn('PostHog capture failed on business-card page', err);
    }
  }, [posthog]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data?.success && Array.isArray(data.categories)) {
          setCategories(data.categories as Category[]);
        }
      } catch (error) {
        console.error('Error fetching categories for business-card page:', error);
      }
    };

    fetchCategories();
  }, []);

  const firstActiveCategorySlug = useMemo(() => {
    const active = categories.find((c) => c.isActive);
    return active?.slug;
  }, [categories]);

  const handleStartGiftingClick = () => {
    try {
      if (posthog) {
        posthog.capture('business_card_start_gifting_click', {
          page: 'business-card',
          path: window.location.pathname,
        });
      }
    } catch {}
  };

  const ctaHref = firstActiveCategorySlug ? `/category/${firstActiveCategorySlug}` : '/';

  return (
    <main 
      className="min-h-screen px-5 py-16 text-[#2E2A27]"
      style={{
        background: `radial-gradient(1000px 600px at 70% 20%, #ffe8c7 0%, ${COLORS.cream} 60%, white 100%)`
      }}
    >
      {/* Hero */}
      <section className="text-center mx-auto mb-8 max-w-[760px]">
        <div 
          className="inline-block px-3 py-1.5 rounded-full font-semibold text-sm mb-3"
          style={{
            background: `${COLORS.teal}22`,
            color: COLORS.teal
          }}
        >
          Thoughtful gifting, made simple
        </div>
        <h1 
          className="text-[clamp(2.3rem,6vw,4rem)] leading-tight tracking-wider mb-1 mt-1 font-serif"
          style={{
            color: COLORS.yellow,
            textShadow: '0 2px 0 rgba(0,0,0,0.05)'
          }}
        >
          Brontie
        </h1>
        <p className="text-lg opacity-90 mt-1 mb-5">
          Send coffee, cake & good vibes — instantly, no app needed.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-2">
          <Link 
            href={ctaHref} 
            onClick={handleStartGiftingClick}
            className="bg-gradient-to-b from-[#ff7a1a] to-[#ff641a] px-5 py-3.5 rounded-full font-bold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              boxShadow: '0 8px 22px rgba(255,100,26,0.25)',
              color: 'white !important'
            }}
          >
            Start gifting
          </Link>
          <a 
            href="mailto:hello@brontie.ie" 
            className="px-4 py-3.5 rounded-full border-2 font-bold bg-white"
            style={{
              borderColor: COLORS.teal,
              color: COLORS.teal
            }}
          >
            Talk to us
          </a>
        </div>
        <p className="mt-2.5 text-sm text-[#6d645d]">
          Live in Maynooth & Leixlip
        </p>
      </section>

      {/* What is Brontie */}
      <section className="max-w-[920px] mx-auto my-4 bg-white rounded-[20px] p-5 shadow-lg">
        <h2 className="text-[clamp(1.35rem,3.2vw,1.75rem)] mb-2.5 mt-0.5">What is Brontie?</h2>
        <p className="leading-relaxed">
          Brontie is Ireland&apos;s first app-free digital gifting platform for small
          treats — think <em>coffee, cake, and moments that make someone&apos;s day</em>.
          You buy a specific treat, share a link via WhatsApp or SMS, and your
          friend redeems it in a local café. Personal, instant, and delightfully
          simple.
        </p>
      </section>

      {/* Origin story */}
      <section className="max-w-[920px] mx-auto my-4 bg-white rounded-[20px] p-5 shadow-lg">
        <h2 className="text-[clamp(1.35rem,3.2vw,1.75rem)] mb-2.5 mt-0.5">How it started</h2>
        <p className="leading-relaxed">
          The idea was born in South Korea. Our founder received a &ldquo;two coffee
          & cake&rdquo; gift from a colleague as a welcome — a specific treat, not a
          generic voucher. Seeing the actual product at redemption felt more
          meaningful than a balance of money. Back home in Ireland, while
          searching for gifts, options felt limited (mostly hampers or
          chocolate). So we built Brontie to bring that warm, tangible style of
          gifting to Ireland.
        </p>
      </section>

      {/* How it works */}
      <section 
        className="max-w-[960px] mx-auto my-4 p-5 rounded-[20px]"
        style={{
          background: `${COLORS.teal}0F`,
          border: `1px solid ${COLORS.teal}30`
        }}
      >
        <h2 className="text-[clamp(1.35rem,3.2vw,1.75rem)] mb-3 mt-0.5">How it works</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-white rounded-2xl p-4 shadow-md grid grid-cols-[auto_1fr] gap-3 items-start">
            <span 
              className="w-9 h-9 rounded-full inline-grid place-items-center font-extrabold"
              style={{
                background: COLORS.yellow,
                color: COLORS.ink
              }}
            >
              1
            </span>
            <div>
              <h3 className="mb-0.5 mt-0 text-lg">Choose a treat</h3>
              <p>Select a coffee or combo from partner cafés (e.g. Willow & Wild).</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md grid grid-cols-[auto_1fr] gap-3 items-start">
            <span 
              className="w-9 h-9 rounded-full inline-grid place-items-center font-extrabold"
              style={{
                background: COLORS.yellow,
                color: COLORS.ink
              }}
            >
              2
            </span>
            <div>
              <h3 className="mb-0.5 mt-0 text-lg">Share in a tap</h3>
              <p>We generate a link you can send via WhatsApp or SMS. No app needed.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-md grid grid-cols-[auto_1fr] gap-3 items-start">
            <span 
              className="w-9 h-9 rounded-full inline-grid place-items-center font-extrabold"
              style={{
                background: COLORS.yellow,
                color: COLORS.ink
              }}
            >
              3
            </span>
            <div>
              <h3 className="mb-0.5 mt-0 text-lg">Redeem locally</h3>
              <p>Your friend scans the café&apos;s QR code using the camera button on their redemption screen.</p>
            </div>
          </div>
        </div>
        <Link
          href={ctaHref}
          onClick={handleStartGiftingClick}
          className="inline-block mt-2.5 font-bold text-[#ff641a]"
        >
          Send a Brontie →
        </Link>
      </section>

      {/* Light tech note */}
      <section className="max-w-[920px] mx-auto my-4 bg-white rounded-[20px] p-5 shadow-lg">
        <h2 className="text-[clamp(1.35rem,3.2vw,1.75rem)] mb-2.5 mt-0.5">Under the hood (lightly)</h2>
        <p className="leading-relaxed">
          Brontie runs on modern web tech with secure
          payments and instant links. We&apos;re exploring point-of-sale integrations
          & lightweight NFC/QR options to make café redemption even smoother —
          while keeping the experience app-free for senders and recipients.
        </p>
      </section>

      {/* Roadmap */}
      <section className="max-w-[920px] mx-auto my-4 bg-white rounded-[20px] p-5 shadow-lg">
        <h2 className="text-[clamp(1.35rem,3.2vw,1.75rem)] mb-2.5 mt-0.5">
          Where we&apos;re heading <span className="text-lg" aria-hidden>🚀</span>
        </h2>
        <ul className="mt-1.5 mb-0 pl-5 leading-relaxed">
          <li>Expanding café partners across North Kildare & Dublin</li>
          <li>New categories (e.g. spa &amp; experience gifts) — just in time for Christmas</li>
          <li>Simple business gifting for teams (onboarding, birthdays, wins)</li>
          <li>Thoughtful rollout to the UK after Irish scale-up</li>
        </ul>
      </section>

      {/* Footer CTA */}
      <section 
        className="max-w-[920px] mx-auto mt-5 bg-white rounded-[20px] p-5 shadow-lg text-center border-2 border-dashed"
        style={{
          borderColor: `${COLORS.teal}44`,
          background: `${COLORS.teal}0C`
        }}
      >
                  <h3 className="text-[clamp(1.35rem,3.2vw,1.75rem)] mb-2.5 mt-0.5">Ready to make someone&apos;s day?</h3>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link 
            href={ctaHref} 
            onClick={handleStartGiftingClick}
            className="bg-gradient-to-b from-[#ff7a1a] to-[#ff641a] px-5 py-3.5 rounded-full font-bold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{
              boxShadow: '0 8px 22px rgba(255,100,26,0.25)',
              color: 'white !important'
            }}
          >
            Start gifting
          </Link>
          <a 
            href="mailto:hello@brontie.ie" 
            className="px-4 py-3.5 rounded-full border-2 font-bold bg-white"
            style={{
              borderColor: COLORS.teal,
              color: COLORS.teal
            }}
          >
            Partner with us
          </a>
        </div>
      </section>
    </main>
  );
}


