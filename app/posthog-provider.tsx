'use client';

import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2025-05-24",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  );
}
