"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, ChevronRight } from 'lucide-react';
import { Navbar } from './Navbar';
import type { CategoryConfig } from '@/lib/category-config';

function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CategoryPage({ config }: { config: CategoryConfig }) {
  const Icon = config.icon;

  const exampleSubtotal = config.exampleItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const exampleVat = config.exampleItems.reduce((sum, item) => {
    const base = item.quantity * item.unitPrice;
    return sum + Math.round(base * item.vatRate / 100);
  }, 0);
  const exampleTotal = exampleSubtotal + exampleVat;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${config.color}18, transparent 70%)` }}
        />

        <FadeIn className="text-center max-w-3xl mx-auto relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold mb-6"
            style={{
              backgroundColor: config.colorMuted,
              borderColor: `${config.color}30`,
              color: config.color,
            }}
          >
            <Icon className="w-4 h-4" />
            {config.title}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            {config.headline}
          </h1>

          <p className="text-white/50 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {config.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/register"
                className="flex items-center gap-2 bg-[#5c32e6] hover:bg-[#4f2bcc] text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-2xl shadow-[#5c32e6]/30 hover:shadow-[#5c32e6]/50"
              >
                <Sparkles className="w-5 h-5" />
                Inizia gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <p className="text-white/25 text-sm">Nessuna carta · Gratis per sempre</p>
          </div>
        </FadeIn>
      </section>

      {/* ── ESEMPIO PREVENTIVO ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-3xl mx-auto">
          <FadeIn delay={0.1} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
              Esempio di preventivo per {config.title.toLowerCase()}
            </h2>
            <p className="text-white/40 text-sm">Generato con AI in 20 secondi</p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="bg-[#111118] border border-white/6 rounded-2xl overflow-hidden">
              {/* Header mockup */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div>
                  <div className="text-xs text-white/30 mb-1">PREVENTIVO</div>
                  <div className="text-sm font-black text-white">PRV-2026-001</div>
                </div>
                <div
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: config.colorMuted, color: config.color }}
                >
                  Bozza
                </div>
              </div>

              {/* Items */}
              <div className="p-5">
                <div className="space-y-2 mb-6">
                  {config.exampleItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{item.description}</p>
                        <p className="text-xs text-white/30 mt-0.5">
                          {item.quantity > 1 ? `${item.quantity} × € ${formatPrice(item.unitPrice)}` : `IVA ${item.vatRate}%`}
                        </p>
                      </div>
                      <p className="text-sm font-black text-white ml-4 shrink-0">
                        {item.unitPrice === 0 ? '—' : `€ ${formatPrice(item.quantity * item.unitPrice)}`}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white/40">
                    <span>Imponibile</span>
                    <span>€ {formatPrice(exampleSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/40">
                    <span>IVA</span>
                    <span>€ {formatPrice(exampleVat)}</span>
                  </div>
                  <div
                    className="flex justify-between text-base font-black text-white px-4 py-3 rounded-xl mt-3"
                    style={{ backgroundColor: config.color + '18', borderLeft: `3px solid ${config.color}` }}
                  >
                    <span>Totale</span>
                    <span>€ {formatPrice(exampleTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── BENEFICI ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
              Perché usare Preventivo Veloce per {config.title.toLowerCase()}
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-5">
            {config.benefits.map((benefit, i) => (
              <FadeIn key={benefit.title} delay={i * 0.08}>
                <div className="bg-[#111118] border border-white/6 rounded-2xl p-6 h-full">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: config.colorMuted }}
                  >
                    <Check className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <h3 className="text-sm font-black text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{benefit.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINALE ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <div className="relative text-center bg-gradient-to-br from-[#5c32e6]/18 to-[#7c3aed]/8 border border-[#5c32e6]/25 rounded-3xl p-8 sm:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#a78bfa]/8 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Pronto a creare il tuo primo preventivo?
                </h2>
                <p className="text-white/40 text-sm mb-8">
                  Gratis, nessuna carta, attivazione in 30 secondi.
                </p>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Link
                    href="/register"
                    className="flex items-center gap-2 bg-[#5c32e6] hover:bg-[#4f2bcc] text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-xl shadow-[#5c32e6]/30"
                  >
                    <Sparkles className="w-5 h-5" />
                    Inizia gratis
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-sm font-black tracking-tight text-white/60">Preventivo</span>
            <span className="text-sm font-black tracking-tight text-[#a78bfa]">Veloce</span>
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/25">
            <Link href="/privacy-policy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/termini" className="hover:text-white/50 transition-colors">Termini</Link>
            <Link href="/" className="hover:text-white/50 transition-colors flex items-center gap-1">
              Tutti i settori <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-white/20">© 2026 Preventivo Veloce</p>
        </div>
      </footer>
    </div>
  );
}
