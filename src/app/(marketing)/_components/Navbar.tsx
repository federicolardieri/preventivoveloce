"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/40'
        : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center group bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl border border-white/5 transition-all hover:shadow-2xl shrink-0">
          <Image
            src="/logo.png"
            alt="Preventivo Veloce"
            width={180}
            height={36}
            className="h-7 sm:h-8 w-auto group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Funzionalità', href: '/#features' },
            { label: 'Come funziona', href: '/#come-funziona' },
            { label: 'Invio email', href: '/#email-flow' },
            { label: 'Prezzi', href: '/#pricing' },
          ].map(item => (
            <a key={item.label} href={item.href} className="text-sm font-semibold text-white/45 hover:text-white transition-colors">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link href="/login" className="text-xs sm:text-sm font-semibold text-white/45 hover:text-white transition-colors px-2 sm:px-3 py-2 min-h-[40px] flex items-center">
            Accedi
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm font-bold bg-[#5c32e6] hover:bg-[#4f2bcc] text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all shadow-lg shadow-[#5c32e6]/25 hover:-translate-y-0.5 hover:shadow-[#5c32e6]/40 whitespace-nowrap min-h-[40px] flex items-center"
          >
            <span className="hidden sm:inline">Inizia Gratis →</span>
            <span className="sm:hidden">Inizia →</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
