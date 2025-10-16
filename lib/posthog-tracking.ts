// PostHog tracking utilities
export interface PostHogEvent {
  event: string;
  properties?: Record<string, unknown>;
}

export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    try {
      ((window as any).posthog as { capture: (event: string, properties?: Record<string, unknown>) => void }).capture(event, properties);
    } catch (error) {
      console.error('PostHog tracking error:', error);
    }
  }
};

// Specific tracking functions for QR code flow
export const trackQRCodeScanned = (data: {
  short_id: string;
  merchant_id: string;
  merchant_name: string;
  location_id: string;
  location_name: string;
  is_from_redeem_page: boolean;
  referrer: string;
}) => {
  trackEvent('qr_code_scanned', data);
};

export const trackQRNavigationToProducts = (data: {
  merchant_id: string;
  merchant_name: string;
  location_id: string | null;
  source: string;
}) => {
  trackEvent('qr_navigation_to_products', data);
};

export const trackGiftPurchaseIntent = (data: {
  gift_item_id: string;
  gift_name: string;
  gift_price: number;
  merchant_id: string;
  merchant_name: string;
  location_ids: string[];
  location_names: string[];
  active_tab: string;
  selected_county: string;
}) => {
  trackEvent('gift_purchase_intent', data);
};

export const trackMerchantTabChanged = (data: {
  tab_name: string;
  selected_county: string;
  total_gifts: number;
}) => {
  trackEvent('merchant_tab_changed', data);
};

export const trackCountyFilterChanged = (data: {
  selected_county: string;
  active_tab: string;
  total_gifts: number;
}) => {
  trackEvent('county_filter_changed', data);
};

export const trackShowAllToggled = (data: {
  show_all: boolean;
  active_tab: string;
  selected_county: string;
  total_gifts: number;
}) => {
  trackEvent('show_all_toggled', data);
};
