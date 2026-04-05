'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Solo in dev — in prod Sentry cattura automaticamente via global-error.tsx
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <html lang="it">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
              Qualcosa è andato storto
            </h1>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              Si è verificato un errore imprevisto. Riprova o torna alla home.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                Riprova
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center h-12 px-8 rounded-2xl border border-border bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Torna alla Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
