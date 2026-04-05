'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_EVENT } from './CookieBanner';

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function AnalyticsProvider() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    setConsent(localStorage.getItem(COOKIE_CONSENT_KEY));

    const handleStorage = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) setConsent(e.newValue);
    };
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setConsent(detail ?? null);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(COOKIE_CONSENT_EVENT, handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COOKIE_CONSENT_EVENT, handleCustom);
    };
  }, []);

  if (!PLAUSIBLE_DOMAIN || consent !== 'accepted') return null;

  return (
    <Script
      defer
      data-domain={PLAUSIBLE_DOMAIN}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
