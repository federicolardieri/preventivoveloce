import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pagina non trovata',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-black text-primary">4</span>
          <span className="text-5xl font-black text-primary/40">0</span>
          <span className="text-5xl font-black text-primary">4</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
          Pagina non trovata
        </h1>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            Torna alla Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl border border-border bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            Vai alla Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
