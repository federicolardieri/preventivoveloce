'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, Zap, Sparkles } from 'lucide-react';

type Billing = 'monthly' | 'annual';

const PAID_PLANS_ENABLED = process.env.NEXT_PUBLIC_PAID_PLANS_ENABLED === 'true';

const PLANS = (billing: Billing) => [
  {
    name: 'Free',
    monthlyPrice: 0,
    price: 0,
    priceLabel: 'Gratis',
    perMonth: null,
    priceId: null,
    credits: '1 preventivo totale',
    badge: null,
    highlight: false,
    features: [
      { text: '1 preventivo totale', included: true },
      { text: 'Tutti gli 8 template PDF', included: true },
      { text: 'Firma digitale del cliente', included: true },
      { text: 'Invio email', included: true },
      { text: 'Nessun watermark', included: false },
      { text: 'Allegati PDF', included: false },
      { text: 'AI assistant', included: false },
    ],
  },
  {
    name: 'Starter',
    monthlyPrice: 9.90,
    price: billing === 'annual' ? 89 : 9.90,
    priceLabel: billing === 'annual' ? '€89' : '€9,90',
    perMonth: billing === 'annual' ? '€7,42/mese' : null,
    priceId: billing === 'annual'
      ? process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID,
    credits: '10 preventivi/mese',
    badge: 'Più scelto',
    highlight: true,
    features: [
      { text: '10 preventivi al mese', included: true },
      { text: 'Tutti gli 8 template PDF', included: true },
      { text: 'Firma digitale del cliente', included: true },
      { text: 'Invio email', included: true },
      { text: 'Nessun watermark', included: true },
      { text: 'Allegati PDF', included: false },
      { text: 'AI assistant', included: false },
    ],
  },
  {
    name: 'Pro',
    monthlyPrice: 29,
    price: billing === 'annual' ? 249 : 29,
    priceLabel: billing === 'annual' ? '€249' : '€29',
    perMonth: billing === 'annual' ? '€20,75/mese' : null,
    priceId: billing === 'annual'
      ? process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    credits: 'Preventivi illimitati',
    badge: null,
    highlight: false,
    features: [
      { text: 'Preventivi illimitati', included: true },
      { text: 'Tutti gli 8 template PDF', included: true },
      { text: 'Firma digitale del cliente', included: true },
      { text: 'Invio email', included: true },
      { text: 'Nessun watermark', included: true },
      { text: 'Allegati PDF (fino a 7 file)', included: true },
      { text: 'AI assistant incluso', included: true },
    ],
  },
];

export default function PrezziPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<Billing>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const plans = PAID_PLANS_ENABLED
    ? PLANS(billing)
    : PLANS(billing).filter((p) => p.name === 'Free');

  async function handleUpgrade(priceId: string | null | undefined, planName: string) {
    if (!priceId) {
      router.push('/register');
      return;
    }
    setLoading(planName);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      if (res.status === 401) {
        router.push('/login?redirect=/prezzi');
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center bg-white px-4 py-2 rounded-2xl shadow-xl border border-white/5">
            <Image src="/logo.png" alt="Preventivo Veloce" width={180} height={36} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-white/45 hover:text-white transition-colors px-3 py-2">
              Accedi
            </Link>
            <Link href="/register" className="text-sm font-bold bg-[#5c32e6] hover:bg-[#4f2bcc] text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#5c32e6]/25">
              Inizia Gratis →
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5c32e6]/10 border border-[#5c32e6]/20 text-[#a78bfa] text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Semplice e trasparente
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">Il piano giusto per te</h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto mb-8">
              Inizia gratis, upgrada quando vuoi. Nessun contratto, cancelli in qualsiasi momento.
            </p>

            {/* Toggle mensile/annuale */}
            {PAID_PLANS_ENABLED && (
              <div className="inline-flex items-center gap-1 bg-white/[0.05] border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-[#5c32e6] text-white shadow' : 'text-white/50 hover:text-white'}`}
                >
                  Mensile
                </button>
                <button
                  onClick={() => setBilling('annual')}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-[#5c32e6] text-white shadow' : 'text-white/50 hover:text-white'}`}
                >
                  Annuale
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    -25%
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Cards */}
          <div className={`grid gap-6 ${PAID_PLANS_ENABLED ? 'md:grid-cols-3' : 'max-w-md mx-auto'}`}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col transition-all ${
                  plan.highlight
                    ? 'border-[#5c32e6] bg-[#5c32e6]/5 ring-1 ring-[#5c32e6]/30'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#5c32e6] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-black mb-1">{plan.name}</h2>
                  <div className="flex items-end gap-1 mt-3">
                    <span className="text-4xl font-black">{plan.priceLabel}</span>
                    {plan.price > 0 && (
                      <span className="text-white/40 text-sm pb-1">
                        {billing === 'annual' ? '/anno' : '/mese'}
                      </span>
                    )}
                  </div>
                  {plan.perMonth && (
                    <p className="text-white/40 text-xs mt-1">{plan.perMonth} — fatturato annualmente</p>
                  )}
                  <p className="text-[#a78bfa] text-sm font-semibold mt-2">{plan.credits}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      {f.included
                        ? <Check className="w-4 h-4 text-[#a78bfa] shrink-0" />
                        : <X className="w-4 h-4 text-white/20 shrink-0" />}
                      <span className={f.included ? 'text-white/80' : 'text-white/30'}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.priceId, plan.name)}
                  disabled={loading === plan.name}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.highlight
                      ? 'bg-[#5c32e6] hover:bg-[#4f2bcc] text-white shadow-lg shadow-[#5c32e6]/25 hover:-translate-y-0.5'
                      : 'bg-white/[0.06] hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {loading === plan.name
                    ? 'Attendere...'
                    : plan.price === 0
                    ? 'Inizia gratis'
                    : `Scegli ${plan.name} →`}
                </button>
              </div>
            ))}
          </div>

          {PAID_PLANS_ENABLED ? (
            <p className="text-center text-white/30 text-sm mt-10">
              Pagamenti sicuri con Stripe · IVA inclusa · Cancelli quando vuoi
            </p>
          ) : (
            <div className="mt-12 max-w-xl mx-auto text-center bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <p className="text-[#a78bfa] text-xs font-black uppercase tracking-widest mb-2">In arrivo</p>
              <p className="text-white/75 text-sm font-semibold mb-1">
                Piani Starter e Pro disponibili a breve
              </p>
              <p className="text-white/45 text-xs">
                Stiamo ultimando l'attivazione dei pagamenti. Intanto inizia gratis con il piano Free — tutte le funzionalità core sono già disponibili.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
