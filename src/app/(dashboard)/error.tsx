'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-10">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">
          Errore imprevisto
        </h2>
        <p className="text-muted-foreground font-medium mb-6 leading-relaxed">
          Qualcosa non ha funzionato. Riprova o torna alla dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-11 px-6 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
          >
            Riprova
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-11 px-6 rounded-2xl border border-border bg-card text-foreground font-bold hover:bg-muted/50 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
