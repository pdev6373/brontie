import type { Metadata } from "next";
import './globals.css';
import { FathomAnalytics } from './fathom';
import { PHProvider } from './posthog-provider';
import Script from "next/script";
import ConditionalHeader from '@/components/shared/ConditionalHeader';
import ConditionalFooter from '@/components/shared/footer/ConditionalFooter';
import ViralLoopTracker from '@/components/ViralLoopTracker';
import SendOneBackCTA from '@/components/SendOneBackCTA';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Brontie - Send Small Surprises",
  description: "Send small surprises like coffee, cake, tickets or passes. Delivered instantly, redeemed locally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Cookiebot — must load before any tags that use cookies */}
        <Script
          id="usercentrics-cmp"
          src="https://web.cmp.usercentrics.eu/ui/loader.js"
          data-settings-id="tYvKBFyuVse4-B"
          async
        />
      </head>
      <body
        className={`antialiased font-sans min-h-screen coffeE-gift-main-wrapper-area`}
      >
        <ConditionalHeader />

        <PHProvider>
          <ViralLoopTracker />
          <FathomAnalytics />
          <main className="page-main-content-wrapper">
            <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
            {children}
          </main>
          <SendOneBackCTA />
        </PHProvider>
        <ConditionalFooter />
      </body>
    </html>
  );
}
