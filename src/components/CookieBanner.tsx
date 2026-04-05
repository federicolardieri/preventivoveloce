'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const COOKIE_CONSENT_KEY = 'cookie_consent';
export const COOKIE_CONSENT_EVENT = 'cookie-consent-change';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function setConsent(value: 'accepted' | 'declined') {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
    setVisible(false);
  }

  function accept() {
    setConsent('accepted');
  }

  function decline() {
    setConsent('declined');
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-lg p-5 pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-card-foreground mb-1">
              Utilizziamo i cookie
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Questo sito utilizza cookie tecnici necessari al funzionamento e cookie analitici
              per migliorare il servizio. Consulta la nostra{' '}
              <a href="/privacy-policy" className="underline text-primary hover:text-primary/80">
                Privacy Policy
              </a>{' '}
              per maggiori informazioni.
            </p>
          </div>
          <button
            onClick={decline}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={decline}
            className="flex-1 h-9 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Solo necessari
          </button>
          <button
            onClick={accept}
            className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Accetta tutti
          </button>
        </div>
      </div>
    </div>
  );
}
