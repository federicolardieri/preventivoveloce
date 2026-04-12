"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Zap, FileText, Sparkles, ArrowRight, Check, X,
  Play, Star, Clock, Download, Palette, ChevronRight,
  Timer, TrendingUp, Shield, Users, Mail, MailCheck, Send, Bell,
} from 'lucide-react';

const PAID_PLANS_ENABLED = process.env.NEXT_PUBLIC_PAID_PLANS_ENABLED === 'true';

// ── Helpers ───────────────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const steps = 50;
    const increment = target / steps;
    let count = 0;
    const timer = setInterval(() => {
      count += increment;
      if (count >= target) { setCurrent(target); clearInterval(timer); }
      else setCurrent(Math.floor(count));
    }, 28);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{current}{suffix}</span>;
}

function FadeIn({
  children,
  delay = 0,
  className = '',
  direction = 'up',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'left' | 'right' | 'none';
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const yMap = { up: 32, left: 0, right: 0, none: 0 };
  const xMap = { up: 0, left: -32, right: 32, none: 0 };
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yMap[direction], x: xMap[direction] }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Marquee ───────────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  { icon: Zap, text: '20 secondi per preventivo' },
  { icon: Sparkles, text: 'AI che capisce l\'italiano' },
  { icon: FileText, text: 'PDF professionale con logo' },
  { icon: Check, text: 'IVA e sconti automatici' },
  { icon: Palette, text: '8 template premium' },
  { icon: Shield, text: 'Dati sicuri su Supabase' },
  { icon: TrendingUp, text: 'Vinci più lavori' },
  { icon: Timer, text: 'Da 30 minuti a 20 secondi' },
  { icon: Download, text: 'PDF da inviare subito' },
  { icon: Mail, text: 'Invio email diretto al cliente' },
  { icon: MailCheck, text: 'Accettazione in un click' },
  { icon: Bell, text: 'Notifica quando accetta' },
  { icon: Users, text: 'Storico clienti completo' },
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="relative overflow-hidden py-4 border-y border-white/5 bg-white/[0.015]">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#0a0a0f] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-[#0a0a0f] to-transparent pointer-events-none" />
      <motion.div
        className="flex gap-8 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 px-4 py-2 bg-white/[0.04] rounded-full border border-white/5 whitespace-nowrap flex-shrink-0">
            <item.icon className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="text-xs font-semibold text-white/50">{item.text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
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
            { label: 'Funzionalità', href: '#features' },
            { label: 'Come funziona', href: '#come-funziona' },
            { label: 'Invio email', href: '#email-flow' },
            { label: 'Prezzi', href: '#pricing' },
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

// ── Floating Orb ──────────────────────────────────────────────────────────────

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        y: [0, -30, 0],
        scale: [1, 1.08, 1],
        opacity: [0.6, 0.9, 0.6],
      }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

// ── Speed Comparison ──────────────────────────────────────────────────────────

function SpeedBar({ label, minutes, max, color, delay }: {
  label: string; minutes: number; max: number; color: string; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/60 font-semibold">{label}</span>
        <span className="font-black text-white">{minutes < 1 ? '20s' : `${minutes} min`}</span>
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={inView ? { width: `${(minutes / max) * 100}%` } : {}}
          transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

// ── Dashboard Mockup ──────────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto origin-top scale-[0.78] sm:scale-90 md:scale-100 -mb-[18%] sm:-mb-[8%] md:mb-0">
      <div className="absolute -inset-6 bg-[#5c32e6]/18 rounded-3xl blur-3xl" />
      <div className="relative bg-[#111118] rounded-2xl border border-white/10 overflow-hidden shadow-[0_40px_140px_-20px_rgba(0,0,0,0.9)]">
        {/* Browser bar */}
        <div className="h-9 bg-[#0d0d14] border-b border-white/5 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-4 flex justify-center">
            <div className="bg-[#1a1a24] rounded h-5 flex items-center px-3 w-64">
              <span className="text-[10px] text-white/25">app.ilpreventivoveloce.it/dashboard</span>
            </div>
          </div>
        </div>

        <div className="flex" style={{ height: 320 }}>
          {/* Sidebar */}
          <div className="w-44 bg-[#0d0d14] border-r border-white/5 p-3 flex flex-col gap-2 flex-shrink-0">
            <motion.div
              className="h-10 bg-[#5c32e6] rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#5c32e6]/30 cursor-pointer"
              whileHover={{ scale: 1.03 }}
            >
              <span className="text-white text-[10px] font-black">+ Nuovo Preventivo</span>
            </motion.div>
            <div className="mt-2 space-y-1">
              {[
                { label: 'Dashboard', active: true },
                { label: 'Preventivi', active: false },
                { label: 'Impostazioni', active: false },
              ].map(r => (
                <div key={r.label} className={`h-8 rounded-lg flex items-center px-3 gap-2 ${r.active ? 'bg-[#5c32e6]/15' : ''}`}>
                  <div className={`w-1 h-3.5 rounded-full ${r.active ? 'bg-[#5c32e6]' : 'bg-transparent'}`} />
                  <span className={`text-[10px] font-semibold ${r.active ? 'text-white' : 'text-white/30'}`}>{r.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto bg-black/30 rounded-xl p-3">
              <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Piano</div>
              <div className="flex items-center gap-1 mb-1.5">
                <Zap className="w-2.5 h-2.5 text-[#5c32e6]" />
                <span className="text-[10px] font-black text-white/70">Pro</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div className="h-1 rounded-full bg-gradient-to-r from-[#5c32e6] to-[#a78bfa] w-3/5" />
              </div>
              <div className="text-[9px] text-white/30 mt-1">14 / 30 preventivi</div>
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Preventivi', value: '24', color: 'text-white', trend: '+3' },
                { label: 'Fatturato', value: '€12.4k', color: 'text-emerald-400', trend: '+18%' },
                { label: 'In attesa', value: '7', color: 'text-blue-400', trend: '' },
                { label: 'Accettati', value: '18', color: 'text-emerald-400', trend: '75%' },
              ].map(k => (
                <div key={k.label} className="bg-[#1a1a24] rounded-xl p-3 border border-white/5">
                  <div className={`text-base font-black ${k.color}`}>{k.value}</div>
                  <div className="text-[8px] text-white/35 font-semibold uppercase tracking-wider mt-0.5">{k.label}</div>
                  {k.trend && <div className="text-[8px] text-emerald-400 font-bold mt-0.5">{k.trend}</div>}
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-[#5c32e6]/30 to-[#7c3aed]/20 rounded-xl border border-[#5c32e6]/30 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                  <Sparkles className="w-3.5 h-3.5 text-[#9d7eff]" />
                </motion.div>
                <span className="text-[11px] font-bold text-white/80">Genera il tuo preventivo con AI in 20 secondi</span>
              </div>
              <div className="bg-white text-[#5c32e6] text-[9px] font-black px-2.5 py-1 rounded-lg">Genera ✨</div>
            </div>

            <div className="bg-[#1a1a24] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Ultimi Preventivi</span>
                <span className="text-[9px] text-[#5c32e6] font-bold">Vedi tutti →</span>
              </div>
              {[
                { n: 'PRV-2026-024', c: 'Acme SRL', v: '€4.200', s: 'accettato', dot: 'bg-emerald-400' },
                { n: 'PRV-2026-023', c: 'Studio Rossi', v: '€1.800', s: 'inviato', dot: 'bg-blue-400' },
                { n: 'PRV-2026-022', c: 'TechCorp Italia', v: '€8.500', s: 'bozza', dot: 'bg-amber-400' },
              ].map(q => (
                <div key={q.n} className="flex items-center px-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${q.dot} mr-2.5 flex-shrink-0`} />
                  <span className="text-[10px] font-bold text-white/80 w-28 flex-shrink-0">{q.n}</span>
                  <span className="text-[10px] text-white/40 flex-1">{q.c}</span>
                  <span className="text-[10px] font-black text-white/80">{q.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Typewriter demo ────────────────────────────────────────────────────────

function AIDemo() {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const fullText = 'Preventivo per Mario Rossi (mario@acme.it) — sito e-commerce 50 prodotti: sviluppo €4.500, Stripe €800, pannello admin €1.200, SEO base €500. IVA 22%.';
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const t = setInterval(() => {
      if (i < fullText.length) { setText(fullText.slice(0, i + 1)); i++; }
      else {
        clearInterval(t);
        setTimeout(() => setPhase(1), 400);
        let s = 0;
        const counter = setInterval(() => {
          s++;
          setSeconds(s);
          if (s >= 18) clearInterval(counter);
        }, 100);
        setTimeout(() => setPhase(2), 2200);
      }
    }, 22);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div ref={ref} className="relative">
      <div className="absolute -inset-3 bg-[#5c32e6]/10 rounded-3xl blur-2xl" />
      <div className="relative bg-[#111118] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="h-9 bg-[#0d0d14] border-b border-white/5 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Sparkles className="w-3 h-3 text-[#5c32e6]" />
            <span className="text-[10px] font-bold text-white/40">AI Assistant — Preventivo Veloce</span>
          </div>
          {phase >= 1 && phase < 2 && (
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5c32e6] animate-pulse" />
              <span className="text-[10px] text-[#a78bfa] font-bold">{seconds}s</span>
            </div>
          )}
          {phase === 2 && (
            <div className="ml-auto flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Check className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-bold">Generato in 18s</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Messaggio utente */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white/50">Tu</div>
            <div className="bg-[#5c32e6]/20 border border-[#5c32e6]/25 rounded-xl px-3 py-2.5 text-xs text-white/80 leading-relaxed flex-1">
              {text}
              {phase === 0 && <span className="animate-pulse text-[#5c32e6]">|</span>}
            </div>
          </div>

          {phase >= 1 && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#5c32e6]/25 border border-[#5c32e6]/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#9d7eff]" />
              </div>
              <div className="flex-1">
                {phase === 1 && (
                  <div className="flex items-center gap-2 py-2">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-2 h-2 rounded-full bg-[#5c32e6] animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                    <span className="text-xs text-white/40 ml-1">Sto generando il preventivo...</span>
                  </div>
                )}
                {phase === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-lg"
                  >
                    {/* Header stile PDF */}
                    <div className="bg-[#5c32e6] px-4 py-3 flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-0.5">Preventivo</p>
                        <p className="text-sm font-black text-white leading-tight">PRV-2026-025</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/70">Acme SRL</p>
                        <p className="text-[10px] text-white/60">mario@acme.it</p>
                      </div>
                    </div>

                    {/* Mittente / Cliente */}
                    <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
                      <div className="px-3 py-2 border-r border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Da</p>
                        <p className="text-[11px] font-black text-gray-800">La Mia Azienda SRL</p>
                        <p className="text-[10px] text-gray-500">info@mia-azienda.it</p>
                      </div>
                      <div className="px-3 py-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">A</p>
                        <p className="text-[11px] font-black text-gray-800">Mario Rossi</p>
                        <p className="text-[10px] text-gray-500">mario@acme.it</p>
                      </div>
                    </div>

                    {/* Voci */}
                    <div className="px-3 py-2">
                      <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1 mb-1.5">
                        <span>Descrizione</span>
                        <span>Importo</span>
                      </div>
                      {[
                        ['Sviluppo e-commerce (50 prodotti)', '€4.500'],
                        ['Integrazione Stripe + checkout', '€800'],
                        ['Pannello admin personalizzato', '€1.200'],
                        ['SEO base + ottimizzazione', '€500'],
                      ].map(([desc, price], idx) => (
                        <div key={desc} className={`flex justify-between items-center py-1 ${idx % 2 === 0 ? 'bg-gray-50/60 -mx-1 px-1 rounded' : ''}`}>
                          <span className="text-[10px] text-gray-700">{desc}</span>
                          <span className="text-[10px] font-black text-gray-900 ml-3">{price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Totali */}
                    <div className="px-3 pb-2.5 space-y-1 border-t border-gray-100 pt-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">Imponibile</span>
                        <span className="font-semibold text-gray-800">€7.000</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">IVA 22%</span>
                        <span className="font-semibold text-gray-800">€1.540</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                        <span className="text-[11px] font-black text-gray-800">Totale</span>
                        <span className="text-sm font-black text-[#5c32e6]">€8.534</span>
                      </div>
                    </div>

                    <div className="px-3 pb-3 flex gap-2">
                      <div className="flex-1 bg-[#5c32e6] rounded-lg py-1.5 text-center text-[10px] font-black text-white">Scarica PDF</div>
                      <div className="bg-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-bold text-gray-500">Invia email</div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Email Flow Demo ───────────────────────────────────────────────────────────

const DEMO_PHASES = [3200, 3200, 3200, 3400];
const DEMO_TOTAL = DEMO_PHASES.reduce((s, d) => s + d, 0);

function EmailFlowDemo() {
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setElapsed(e => {
        const next = (e + 80) % DEMO_TOTAL;
        let acc = 0;
        for (let i = 0; i < DEMO_PHASES.length; i++) {
          acc += DEMO_PHASES[i];
          if (next < acc) { setPhase(i); break; }
        }
        return next;
      });
    }, 80);
    return () => clearInterval(id);
  }, [inView]);

  const phaseStart = DEMO_PHASES.slice(0, phase).reduce((s, d) => s + d, 0);
  const phaseProgress = Math.min((elapsed - phaseStart) / DEMO_PHASES[phase], 1);

  const STEPS = [
    { label: '1. Invio dal tuo account', dot: 'bg-[#5c32e6]' },
    { label: '2. Email al cliente', dot: 'bg-blue-400' },
    { label: '3. Cliente accetta', dot: 'bg-emerald-400' },
    { label: '4. Notifiche automatiche', dot: 'bg-amber-400' },
  ];

  return (
    <div ref={ref} className="relative">
      <div className="absolute -inset-3 bg-emerald-500/8 rounded-3xl blur-3xl" />
      <div className="relative bg-[#111118] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">

        {/* Browser bar */}
        <div className="h-9 bg-[#0d0d14] border-b border-white/5 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-white/40">Demo in tempo reale</span>
          </div>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === phase ? `w-8 ${s.dot}` : i < phase ? `w-3 ${s.dot} opacity-60` : 'w-1.5 bg-white/10'}`} />
            ))}
          </div>
        </div>

        {/* Step label */}
        <div className="px-4 pt-3 pb-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${STEPS[phase].dot}`} />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{STEPS[phase].label}</span>
            </motion.div>
          </AnimatePresence>
          {/* Progress bar */}
          <div className="mt-1.5 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${STEPS[phase].dot}`}
              animate={{ width: `${phaseProgress * 100}%` }}
              transition={{ duration: 0.08, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="p-4">
          <AnimatePresence mode="wait">

            {/* Phase 0 — App: invio preventivo */}
            {phase === 0 && (
              <motion.div key="p0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="bg-[#0d0d14] rounded-xl border border-white/8 overflow-hidden">
                  <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Preventivo Veloce — Il tuo account</span>
                  </div>
                  <div className="p-3">
                    <div className="bg-[#1a1a24] rounded-lg border border-white/5 p-3 mb-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-white/70">PRV-2026-025</span>
                        <span className="text-[9px] bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full font-bold">Pronto</span>
                      </div>
                      <p className="text-[9px] text-white/35 mb-2">Sito E-commerce • Acme SRL • mario.rossi@acme.it</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-white/40">Totale + IVA</span>
                        <span className="text-sm font-black text-white">€8.534</span>
                      </div>
                    </div>
                    <motion.button
                      animate={{ boxShadow: ['0 0 0 0 rgba(92,50,230,0)', '0 0 0 8px rgba(92,50,230,0.25)', '0 0 0 0 rgba(92,50,230,0)'] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="w-full bg-[#5c32e6] rounded-lg py-2.5 flex items-center justify-center gap-2 text-[11px] font-black text-white"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Invia via email a mario.rossi@acme.it
                    </motion.button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 px-1">
                  <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-[#5c32e6]">
                    <Send className="w-3 h-3" />
                  </motion.div>
                  <span className="text-[9px] text-white/30">PDF allegato automaticamente · Link accettazione generato · Valido 30 giorni</span>
                </div>
              </motion.div>
            )}

            {/* Phase 1 — Inbox del cliente */}
            {phase === 1 && (
              <motion.div key="p1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="bg-[#f1f5f9] rounded-xl overflow-hidden border border-gray-200 shadow-md">
                  {/* inbox topbar */}
                  <div className="bg-gray-200 px-3 py-1.5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Inbox — mario@acme.it</span>
                  </div>
                  {/* Email row non letta */}
                  <div className="bg-[#eef2ff] px-3 py-2.5 border-b border-indigo-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#5c32e6] to-[#a78bfa] flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">PV</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-black text-gray-900">La Mia Azienda SRL via Preventivo Veloce</span>
                          <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">adesso</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-700 truncate">Preventivo PRV-2026-025 — Sito E-commerce</p>
                        <p className="text-[10px] text-gray-500 truncate">Ciao Mario, ti invio il preventivo. Trovi il PDF in allegato...</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#5c32e6] flex-shrink-0" />
                    </div>
                  </div>
                  {/* Corpo email aperta */}
                  <div className="bg-white px-3 py-3">
                    <p className="text-[12px] font-bold text-gray-800 mb-1">Ciao Mario,</p>
                    <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
                      <strong className="text-gray-800">La Mia Azienda SRL</strong> ti ha inviato il preventivo <strong className="text-gray-800">PRV-2026-025</strong> per il sito e-commerce. Trovi il PDF completo in allegato.
                    </p>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 mb-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-800">Preventivo-PRV-2026-025.pdf</p>
                        <p className="text-[10px] text-gray-500">Totale €8.534 · PDF allegato</p>
                      </div>
                      <span className="text-[11px] text-[#5c32e6] font-bold flex-shrink-0">Apri</span>
                    </div>
                    <motion.button
                      animate={{ boxShadow: ['0 0 0 0 rgba(34,197,94,0)', '0 0 0 8px rgba(34,197,94,0.2)', '0 0 0 0 rgba(34,197,94,0)'] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="w-full bg-emerald-500 text-white text-[12px] font-black py-2.5 rounded-lg"
                    >
                      ✓ Accetta il preventivo
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Phase 2 — Pagina di accettazione */}
            {phase === 2 && (
              <motion.div key="p2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="bg-[#0a0a0f] rounded-xl border border-white/10 overflow-hidden">
                  <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                    <div className="flex-1 bg-[#1a1a24] rounded h-5 flex items-center px-2">
                      <span className="text-[8px] text-white/25">ilpreventivoveloce.it/firma/a8f3...</span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col items-center text-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#5c32e6]/15 border border-[#5c32e6]/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#a78bfa]" />
                    </div>
                    <div>
                      <p className="text-[9px] text-white/35 uppercase tracking-widest font-black mb-0.5">Preventivo</p>
                      <p className="text-sm font-black text-white">PRV-2026-025</p>
                      <p className="text-[9px] text-white/40">da <span className="text-white/60 font-semibold">Acme SRL</span></p>
                    </div>
                    <div className="w-full bg-white/5 rounded-lg border border-white/8 p-2 text-left space-y-1.5">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-white/40">Destinatario</span>
                        <span className="text-white/70 font-semibold">Mario Rossi</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-white/40">Importo</span>
                        <span className="text-white/70 font-semibold">€8.534</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-white/40">Validità</span>
                        <span className="text-white/70 font-semibold">30 giorni</span>
                      </div>
                    </div>
                    <motion.button
                      animate={phaseProgress > 0.5 ? { scale: [1, 1.05, 1], boxShadow: ['0 0 0 0 rgba(92,50,230,0)', '0 0 0 10px rgba(92,50,230,0.3)', '0 0 0 0 rgba(92,50,230,0)'] } : {}}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="w-full bg-[#5c32e6] rounded-lg py-2.5 text-white text-[11px] font-black flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accetto il preventivo
                    </motion.button>
                    <p className="text-[7px] text-white/25 leading-relaxed">L'accettazione viene registrata con data, ora e IP. Nessun account richiesto.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Phase 3 — Notifiche email */}
            {phase === 3 && (
              <motion.div key="p3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="space-y-2">
                  {/* Email notifica al mittente */}
                  <div className="bg-[#f0fdf4] rounded-xl overflow-hidden border border-green-200 shadow-sm">
                    <div className="bg-green-100 px-3 py-1.5 border-b border-green-200 flex items-center justify-between">
                      <span className="text-[11px] font-black text-green-800 uppercase tracking-widest">📤 La tua inbox — mittente</span>
                      <span className="text-[10px] text-green-700 font-bold">adesso</span>
                    </div>
                    <div className="bg-white px-3 py-2.5">
                      <p className="text-[12px] font-black text-gray-900 mb-1">🎉 Mario Rossi ha accettato PRV-2026-025</p>
                      <p className="text-[11px] text-gray-600 mb-2 leading-relaxed">
                        Il preventivo è stato aggiornato ad <strong className="text-emerald-700">Accettato</strong> nel tuo account. Trovi il PDF timbrato in allegato.
                      </p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-green-50 rounded-lg border border-green-200 p-2 text-center">
                          <p className="text-[12px] font-black text-green-700">€8.534</p>
                          <p className="text-[10px] text-gray-500">Importo accettato</p>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-2 text-center">
                          <p className="text-[12px] font-black text-gray-800">PDF ✓</p>
                          <p className="text-[10px] text-gray-500">Timbrato allegato</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Email conferma al cliente */}
                  <div className="bg-[#eff6ff] rounded-xl overflow-hidden border border-blue-200 shadow-sm">
                    <div className="bg-blue-100 px-3 py-1.5 border-b border-blue-200 flex items-center justify-between">
                      <span className="text-[11px] font-black text-blue-800 uppercase tracking-widest">📥 Conferma a mario@acme.it</span>
                      <span className="text-[10px] text-blue-700 font-bold">adesso</span>
                    </div>
                    <div className="bg-white px-3 py-2.5">
                      <p className="text-[12px] font-black text-gray-900 mb-1">Hai accettato il preventivo PRV-2026-025</p>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Accettato il <strong className="text-gray-800">{new Date().toLocaleDateString('it-IT')}</strong>. Il PDF con timbro di accettazione è in allegato. <strong className="text-gray-800">La Mia Azienda SRL</strong> ti contatterà presto.
                      </p>
                    </div>
                  </div>
                  {/* Status app */}
                  <div className="bg-[#0d0d14] rounded-lg border border-emerald-500/20 px-3 py-2 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-white/80">Stato aggiornato automaticamente</p>
                      <p className="text-[10px] text-white/40">PRV-2026-025 → Accettato · Dashboard aggiornata</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Marco Ferretti',
    role: 'Freelance Web Developer',
    avatar: 'MF',
    color: 'from-[#5c32e6] to-[#7c3aed]',
    text: 'Ho chiuso 3 clienti in una settimana che prima mi avrebbero risposto "ci devo pensare". Il preventivo arriva in 20 secondi — loro non hanno il tempo di ripensarci.',
    stars: 5,
  },
  {
    name: 'Laura Bianchi',
    role: 'Studio di Interior Design',
    avatar: 'LB',
    color: 'from-pink-500 to-rose-500',
    text: 'Ho alzato i prezzi del 20% perché i miei preventivi sembrano fatti da uno studio da 20 persone. I clienti li aprono, li vedono professionali e accettano.',
    stars: 5,
  },
  {
    name: 'Andrea Conti',
    role: 'Agenzia di Marketing',
    avatar: 'AC',
    color: 'from-emerald-500 to-teal-500',
    text: 'Il tasso di accettazione è salito del 30%. Non perché siamo più bravi — perché arriviamo prima. Il primo preventivo che legge il cliente di solito è quello che vince.',
    stars: 5,
  },
  {
    name: 'Sofia Romano',
    role: 'Fotografa Professionista',
    avatar: 'SR',
    color: 'from-amber-500 to-orange-500',
    text: 'Prima mandavo preventivi a mano e aspettavo giorni. Adesso rispondo entro minuti dalla chiamata. I clienti restano colpiti e si fidano di più. Fatturato +40%.',
    stars: 5,
  },
  {
    name: 'Davide Mori',
    role: 'Idraulico - Mori Impianti',
    avatar: 'DM',
    color: 'from-blue-500 to-indigo-500',
    text: 'Arrivo dal cantiere, scrivo cosa ho fatto sul telefono, e il cliente ha già il preventivo. Molti mi dicono "quanto sei veloce". È questo che li convince a scegliermi.',
    stars: 5,
  },
];

function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#5c32e6]/3 to-transparent pointer-events-none" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <FadeIn className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-bold px-3 py-1.5 rounded-full mb-5">
            <Star className="w-3.5 h-3.5 fill-current" />
            Già usato da centinaia di professionisti
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Chi l'ha provato
            <br />
            <span className="bg-gradient-to-r from-[#7c52ff] to-[#c4b5fd] bg-clip-text text-transparent">non torna indietro.</span>
          </h2>
        </FadeIn>

        {/* Featured testimonial */}
        <div className="relative min-h-[260px] sm:h-56 mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <div className="bg-[#111118] border border-white/8 rounded-2xl p-5 sm:p-8 h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#5c32e6]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: TESTIMONIALS[active].stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/70 text-base leading-relaxed italic">"{TESTIMONIALS[active].text}"</p>
                </div>
                <div className="flex items-center gap-3 mt-4 relative z-10">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${TESTIMONIALS[active].color} flex items-center justify-center text-white text-sm font-black flex-shrink-0`}>
                    {TESTIMONIALS[active].avatar}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{TESTIMONIALS[active].name}</p>
                    <p className="text-xs text-white/40">{TESTIMONIALS[active].role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-8 bg-[#5c32e6]' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  const [annual, setAnnual] = useState(false);

  const allPlans = [
    {
      name: 'Free',
      price: '€0',
      sub: 'per sempre',
      desc: 'Per iniziare senza rischi',
      highlight: false,
      features: [
        { ok: true, text: '1 preventivo totale' },
        { ok: true, text: 'Template standard' },
        { ok: true, text: 'AI Assistant' },
        { ok: false, text: 'PDF senza watermark' },
        { ok: false, text: 'Template premium' },
        { ok: false, text: 'Preventivi illimitati' },
      ],
      cta: 'Inizia Gratis',
      ctaClass: 'bg-white/8 hover:bg-white/14 text-white border border-white/10',
    },
    {
      name: 'Starter',
      price: annual ? '€99' : '€9.90',
      sub: annual ? '/anno' : '/mese',
      desc: 'Per freelance e piccoli studi',
      highlight: false,
      features: [
        { ok: true, text: '10 preventivi/mese' },
        { ok: true, text: 'Template standard' },
        { ok: true, text: 'AI Assistant' },
        { ok: true, text: 'PDF senza watermark' },
        { ok: false, text: 'Template premium' },
        { ok: false, text: 'Preventivi illimitati' },
      ],
      cta: 'Inizia con Starter',
      ctaClass: 'bg-white/8 hover:bg-white/14 text-white border border-white/10',
    },
    {
      name: 'Pro',
      price: annual ? '€249' : '€29',
      sub: annual ? '/anno' : '/mese',
      desc: 'Per chi vuole chiudere più clienti',
      highlight: true,
      badge: 'Più popolare',
      features: [
        { ok: true, text: 'Preventivi illimitati' },
        { ok: true, text: 'Tutti i template' },
        { ok: true, text: 'AI Assistant avanzato' },
        { ok: true, text: 'PDF senza watermark' },
        { ok: true, text: 'Template premium' },
        { ok: true, text: 'Supporto prioritario' },
      ],
      cta: 'Inizia con Pro',
      ctaClass: 'bg-[#5c32e6] hover:bg-[#4f2bcc] text-white shadow-xl shadow-[#5c32e6]/30',
    },
  ];

  const plans = PAID_PLANS_ENABLED
    ? allPlans
    : allPlans.filter((p) => p.name === 'Free');

  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-28 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Un preventivo chiuso
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">paga mesi di abbonamento.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-lg mx-auto mb-8">
            Inizia gratis. Nessuna carta di credito richiesta.
          </p>
          {PAID_PLANS_ENABLED && (
            <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1">
              {[false, true].map(a => (
                <button
                  key={String(a)}
                  onClick={() => setAnnual(a)}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${annual === a ? 'bg-white text-black shadow' : 'text-white/45 hover:text-white'}`}
                >
                  {a ? 'Annuale' : 'Mensile'}
                  {a && <span className="text-[10px] font-black bg-emerald-400 text-black px-1.5 py-0.5 rounded-md">-16%</span>}
                </button>
              ))}
            </div>
          )}
        </FadeIn>

        <div className={`grid gap-5 ${PAID_PLANS_ENABLED ? 'md:grid-cols-3' : 'max-w-md mx-auto'}`}>
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.08}>
              <motion.div
                className={`relative bg-[#111118] rounded-2xl border p-5 sm:p-7 flex flex-col h-full transition-all ${
                  plan.highlight
                    ? 'border-[#5c32e6] ring-1 ring-[#5c32e6]/40 shadow-2xl shadow-[#5c32e6]/10'
                    : 'border-white/8'
                }`}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#5c32e6] text-white text-[11px] font-black px-4 py-1 rounded-full shadow-lg">
                      ✦ Più popolare
                    </div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#5c32e6]/8 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  </>
                )}
                <div className="mb-6 relative z-10">
                  <p className="text-[11px] font-black text-white/35 uppercase tracking-widest mb-3">{plan.name}</p>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-white/35 font-semibold text-sm">{plan.sub}</span>
                  </div>
                  <p className="text-sm text-white/40">{plan.desc}</p>
                </div>

                <div className="space-y-3 flex-1 mb-8 relative z-10">
                  {plan.features.map(f => (
                    <div key={f.text} className="flex items-center gap-2.5">
                      {f.ok
                        ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        : <X className="w-4 h-4 text-white/18 flex-shrink-0" />
                      }
                      <span className={`text-sm ${f.ok ? 'text-white/75' : 'text-white/25'}`}>{f.text}</span>
                    </div>
                  ))}
                </div>

                <Link href="/register" className={`relative z-10 block w-full py-3 rounded-xl font-bold text-sm text-center transition-all hover:-translate-y-0.5 ${plan.ctaClass}`}>
                  {plan.cta}
                </Link>
              </motion.div>
            </FadeIn>
          ))}
        </div>

        {!PAID_PLANS_ENABLED && (
          <FadeIn>
            <div className="mt-10 max-w-xl mx-auto text-center bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <p className="text-[#a78bfa] text-[10px] font-black uppercase tracking-widest mb-2">In arrivo</p>
              <p className="text-white/75 text-sm font-semibold mb-1">
                Piani Starter e Pro disponibili a breve
              </p>
              <p className="text-white/45 text-xs">
                Stiamo ultimando l&apos;attivazione dei pagamenti. Intanto inizia gratis con il piano Free.
              </p>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-10 px-4 sm:px-6 overflow-hidden">
        {/* Animated background */}
        <FloatingOrb className="top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#5c32e6]/14" delay={0} />
        <FloatingOrb className="top-10 right-10 w-72 h-72 bg-indigo-600/10" delay={2} />
        <FloatingOrb className="bottom-20 left-10 w-56 h-56 bg-purple-600/8" delay={4} />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.022]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#5c32e6]/12 border border-[#5c32e6]/25 text-[#a78bfa] text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full mb-10"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
              <Sparkles className="w-3.5 h-3.5" />
            </motion.div>
            Chiudi più clienti. Lavora meno.
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-[32px] sm:text-5xl md:text-7xl lg:text-[88px] font-black tracking-tight leading-[0.95] mb-6"
          >
            Basta preventivi
            <br />
            <span className="bg-gradient-to-r from-[#7c52ff] via-[#a78bfa] to-[#c4b5fd] bg-clip-text text-transparent">
              su Excel.
            </span>
          </motion.h1>

          {/* Speed highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-4 bg-white/[0.04] border border-white/8 rounded-2xl px-6 py-3 mb-6"
          >
            <div className="text-center">
              <div className="text-2xl font-black text-red-400 line-through opacity-60">30 min</div>
              <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">prima</div>
            </div>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5 text-white/30" />
            </motion.div>
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400">20s</div>
              <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">adesso</div>
            </div>
          </motion.div>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.25 }}
            className="text-base sm:text-lg md:text-xl text-white/45 max-w-2xl mx-auto leading-relaxed mb-10 px-2 sm:px-0"
          >
            Descrivi il lavoro in una frase.{' '}
            <span className="text-white/80 font-semibold">Lui crea voci, prezzi, IVA e PDF professionale</span>{' '}
            in 20 secondi — pronto da inviare al cliente.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 mb-16 sm:mb-20"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2.5 bg-[#5c32e6] hover:bg-[#4f2bcc] text-white font-bold px-5 sm:px-8 py-4 rounded-2xl text-[13px] sm:text-base transition-all shadow-2xl shadow-[#5c32e6]/30 hover:shadow-[#5c32e6]/50 min-h-[52px] text-center"
              >
                <Sparkles className="w-5 h-5 shrink-0" />
                <span className="text-center">Crea il tuo primo preventivo in 20 secondi</span>
              </Link>
            </motion.div>
            <a
              href="#come-funziona"
              className="flex items-center gap-2 text-white/45 hover:text-white font-semibold px-6 py-4 rounded-2xl transition-colors"
            >
              <Play className="w-4 h-4" />
              Guarda come funziona
            </a>
          </motion.div>

          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 70, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <DashboardMockup />
          </motion.div>
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <Marquee />

      {/* ── STATS ── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { value: 20, suffix: 's', label: 'Dal brief al PDF professionale', icon: Zap, color: 'text-amber-400' },
            { value: 90, suffix: 'x', label: 'Più veloce di Excel e Word', icon: TrendingUp, color: 'text-[#a78bfa]' },
            { value: 30, suffix: '%', label: 'Più preventivi accettati dai clienti', icon: Check, color: 'text-emerald-400' },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.1}>
              <div className="group">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#7c52ff] to-[#c4b5fd] bg-clip-text text-transparent mb-2">
                  <AnimatedNumber target={s.value} suffix={s.suffix} />
                </div>
                <p className="text-sm text-white/35 font-medium leading-snug">{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PROBLEMA / SOLUZIONE ── */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Ogni preventivo lento
              <br />
              <span className="bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">è un cliente perso.</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Il cliente aspetta il tuo preventivo. Nel frattempo, un concorrente
              più veloce lo chiude lui.
            </p>
          </FadeIn>

          {/* Speed bars comparison */}
          <FadeIn className="mb-10">
            <div className="bg-[#111118] border border-white/6 rounded-2xl p-5 sm:p-8 mb-5">
              <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-6">Tempo medio per creare un preventivo</p>
              <div className="space-y-5">
                <SpeedBar label="Excel / Word" minutes={35} max={40} color="bg-gradient-to-r from-red-500/80 to-red-400/60" delay={0} />
                <SpeedBar label="Altri tool SaaS" minutes={8} max={40} color="bg-gradient-to-r from-amber-500/80 to-amber-400/60" delay={0.1} />
                <SpeedBar label="Preventivo Veloce con AI" minutes={0.3} max={40} color="bg-gradient-to-r from-[#5c32e6] to-[#a78bfa]" delay={0.2} />
              </div>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-5">
            <FadeIn direction="left">
              <div className="bg-[#111118] rounded-2xl border border-white/6 p-5 sm:p-8 h-full">
                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 text-[11px] font-black px-3 py-1.5 rounded-full mb-7 uppercase tracking-widest">
                  ✗ Prima — con Excel
                </div>
                <ul className="space-y-4">
                  {[
                    'Sprechi 30-45 minuti per ogni preventivo',
                    'Sbagli il calcolo IVA o lo sconto',
                    'Il PDF sembra fatto da un ragazzino',
                    'Il cliente ti chiede modifiche, ricominci da capo',
                    'Aspetti troppo, lui si rivolge a un concorrente',
                    'Perdi il lavoro per colpa di un foglio Excel',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-white/40 text-sm">
                      <X className="w-4 h-4 text-red-500/70 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn direction="right">
              <div className="bg-[#111118] rounded-2xl border border-[#5c32e6]/35 p-5 sm:p-8 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#5c32e6]/8 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-[11px] font-black px-3 py-1.5 rounded-full mb-7 uppercase tracking-widest">
                    ✓ Con Preventivo Veloce
                  </div>
                  <ul className="space-y-4">
                    {[
                      'Scrivi una frase. Lui crea tutto il resto.',
                      'Voci, prezzi e IVA generati in automatico',
                      'PDF con logo tuo — sembra uno studio da 10 persone',
                      'Il cliente riceve il preventivo mentre ancora ci pensa',
                      'Modifica in un clic, PDF aggiornato all\'istante',
                      'Chi risponde prima, chiude il cliente.',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-3 text-white/75 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section id="come-funziona" className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#5c32e6]/5 via-transparent to-transparent pointer-events-none" />
        <FloatingOrb className="top-1/2 right-0 w-96 h-96 bg-[#5c32e6]/8" delay={1} />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            <FadeIn direction="left">
              <div className="inline-flex items-center gap-2 bg-[#5c32e6]/12 border border-[#5c32e6]/20 text-[#a78bfa] text-sm font-bold px-3 py-1.5 rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI integrata — in italiano
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-5 leading-tight">
                Scrivi una frase.
                <br />
                <span className="text-[#a78bfa]">Il resto lo fa lui.</span>
              </h2>
              <p className="text-white/45 text-base leading-relaxed mb-8">
                Digiti "sito e-commerce con Stripe e pannello admin". L'AI
                capisce, crea le voci, suggerisce i prezzi, calcola IVA e sconti,
                e genera un PDF professionale — in 20 secondi.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Zap, text: 'Voci e prezzi automatici in 20 secondi', color: 'bg-amber-500/15 text-amber-300' },
                  { icon: FileText, text: 'IVA, sconti e totali sempre corretti', color: 'bg-[#5c32e6]/15 text-[#a78bfa]' },
                  { icon: Download, text: 'PDF con logo tuo — zero lavoro manuale', color: 'bg-emerald-500/15 text-emerald-300' },
                ].map(({ icon: Icon, text, color }) => (
                  <motion.div
                    key={text}
                    className="flex items-center gap-3"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-white/65 font-medium text-sm">{text}</span>
                  </motion.div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.15} direction="right">
              <AIDemo />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 bg-white/[0.015] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              In 4 passi, il cliente accetta
            </h2>
            <p className="text-white/35 text-base">Dal brief alla firma digitale — tutto automatico.</p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-7 left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-px bg-gradient-to-r from-[#5c32e6]/30 via-[#5c32e6]/60 to-emerald-500/30" />

            {[
              {
                n: '01',
                title: 'Crea l\'account',
                desc: 'Registrati in 30 secondi. Nessuna carta. Piano Free incluso per sempre.',
                icon: Users,
                color: 'bg-[#5c32e6]/15 border-[#5c32e6]/25 text-[#a78bfa]',
              },
              {
                n: '02',
                title: 'Descrivi il lavoro',
                desc: 'Scrivi in italiano. L\'AI genera voci, prezzi, IVA e PDF in 20 secondi.',
                icon: Sparkles,
                color: 'bg-[#5c32e6]/15 border-[#5c32e6]/25 text-[#a78bfa]',
              },
              {
                n: '03',
                title: 'Invia via email',
                desc: 'Un click. Il PDF arriva al cliente con il pulsante di accettazione integrato.',
                icon: Send,
                color: 'bg-[#5c32e6]/15 border-[#5c32e6]/25 text-[#a78bfa]',
              },
              {
                n: '04',
                title: 'Il cliente accetta',
                desc: 'Clicca "Accetto" dall\'email. Tu ricevi notifica e il PDF timbrato — automatico.',
                icon: MailCheck,
                color: 'bg-[#5c32e6]/15 border-[#5c32e6]/25 text-[#a78bfa]',
              },
            ].map((step, i) => (
              <FadeIn key={step.n} delay={i * 0.1}>
                <div className="text-center relative">
                  <motion.div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-5 relative z-10 ${step.color}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-xl font-black">{step.n}</span>
                  </motion.div>
                  <h3 className="text-base font-black text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 sm:py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Tutto quello che ti serve,<br />niente di superfluo
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              {
                icon: Sparkles, title: 'AI che lavora per te',
                desc: "Una frase in italiano. Lui genera voci, prezzi e totali — tu firmi e incassi.",
                glow: 'hover:border-[#5c32e6]/40 hover:shadow-[#5c32e6]/10',
                iconBg: 'bg-[#5c32e6]/15', iconColor: 'text-[#a78bfa]',
                glowBg: 'group-hover:bg-[#5c32e6]/5',
              },
              {
                icon: Palette, title: '8 Template Pro',
                desc: 'Classic, Modern, Bold, Executive e altro. PDF bellissimi con il tuo brand.',
                glow: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
                iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-300',
                glowBg: 'group-hover:bg-indigo-500/5',
              },
              {
                icon: Zap, title: 'Rispondi prima degli altri',
                desc: 'Da 30 minuti a 20 secondi. Chi arriva primo chiude il cliente. Punto.',
                glow: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
                iconBg: 'bg-amber-500/15', iconColor: 'text-amber-300',
                glowBg: 'group-hover:bg-amber-500/5',
              },
              {
                icon: FileText, title: 'PDF che impressiona',
                desc: 'Logo tuo, colori brand, layout pulito. Il cliente capisce che sei serio.',
                glow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
                iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-300',
                glowBg: 'group-hover:bg-emerald-500/5',
              },
              {
                icon: Clock, title: 'Storico Completo',
                desc: 'Tutti i tuoi preventivi in un posto. Filtra per stato, cliente, importo.',
                glow: 'hover:border-blue-500/40 hover:shadow-blue-500/10',
                iconBg: 'bg-blue-500/15', iconColor: 'text-blue-300',
                glowBg: 'group-hover:bg-blue-500/5',
              },
              {
                icon: Star, title: 'Zero errori, sempre',
                desc: 'IVA e sconti calcolati al centesimo. Nessun imbarazzo con il cliente.',
                glow: 'hover:border-rose-500/40 hover:shadow-rose-500/10',
                iconBg: 'bg-rose-500/15', iconColor: 'text-rose-300',
                glowBg: 'group-hover:bg-rose-500/5',
              },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.06}>
                <motion.div
                  className={`group bg-[#111118] border border-white/6 rounded-2xl p-6 hover:border-white/14 transition-all h-full relative overflow-hidden hover:shadow-xl ${f.glow}`}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`absolute inset-0 transition-all duration-500 ${f.glowBg}`} />
                  <div className="relative z-10">
                    <motion.div
                      className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-4`}
                      whileHover={{ scale: 1.15, rotate: 8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <f.icon className={`w-5 h-5 ${f.iconColor}`} />
                    </motion.div>
                    <h3 className="text-base font-black text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMAIL FLOW ── */}
      <section id="email-flow" className="py-16 sm:py-20 md:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent pointer-events-none" />
        <FloatingOrb className="top-1/2 left-0 w-80 h-80 bg-emerald-500/6" delay={2} />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">

            {/* Left: demo */}
            <FadeIn direction="left">
              <EmailFlowDemo />
            </FadeIn>

            {/* Right: copy */}
            <FadeIn delay={0.12} direction="right">
              <div className="inline-flex items-center gap-2 bg-emerald-500/12 border border-emerald-500/20 text-emerald-300 text-sm font-bold px-3 py-1.5 rounded-full mb-6">
                <MailCheck className="w-3.5 h-3.5" />
                Nuova funzione — Invio automatico
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-5 leading-tight">
                Invia. Il cliente
                <br />
                <span className="text-emerald-300">accetta. Tu vinci.</span>
              </h2>
              <p className="text-white/45 text-base leading-relaxed mb-8">
                Clicchi "Invia via email" e il preventivo arriva direttamente al cliente con un pulsante{' '}
                <span className="text-white/75 font-semibold">Accetta Preventivo</span>.
                Quando firma, ricevi subito una notifica — senza muovere un dito.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    icon: Send,
                    color: 'bg-[#5c32e6]/15 text-[#a78bfa]',
                    title: 'Invio diretto al cliente',
                    desc: 'Un click e il preventivo è nella sua inbox, con il PDF allegato.',
                  },
                  {
                    icon: MailCheck,
                    color: 'bg-emerald-500/15 text-emerald-300',
                    title: 'Accettazione in un click',
                    desc: 'Il cliente clicca "Accetta" direttamente dall\'email — nessun account necessario.',
                  },
                  {
                    icon: Bell,
                    color: 'bg-amber-500/15 text-amber-300',
                    title: 'Notifica immediata',
                    desc: 'Ricevi un\'email nel momento esatto in cui il cliente accetta. Stato aggiornato in automatico.',
                  },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <motion.div
                    key={title}
                    className="flex items-start gap-3"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white/80 mb-0.5">{title}</p>
                      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-[#111118] border border-white/6 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-black text-white/80">Dal primo invio all'accettazione</p>
                  <p className="text-xs text-white/40">I preventivi inviati via email vengono accettati in media <span className="text-emerald-400 font-black">7 minuti</span> dopo l'apertura.</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <Testimonials />

      {/* ── PRICING ── */}
      <Pricing />

      {/* ── FINAL CTA ── */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="relative text-center">
              <FloatingOrb className="inset-0 w-full h-full bg-[#5c32e6]/10 blur-3xl rounded-3xl" delay={0} />
              <div className="relative bg-gradient-to-br from-[#5c32e6]/18 to-[#7c3aed]/8 border border-[#5c32e6]/25 rounded-3xl p-6 sm:p-10 md:p-14 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#a78bfa]/8 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#5c32e6]/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
                <div className="relative z-10">
                  <motion.div
                    className="text-5xl mb-5 inline-block"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    🚀
                  </motion.div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                    Il prossimo cliente
                    <br />
                    <span className="bg-gradient-to-r from-[#a78bfa] to-[#c4b5fd] bg-clip-text text-transparent">lo chiudi tu.</span>
                  </h2>
                  <p className="text-white/40 text-base sm:text-lg mb-8 sm:mb-10">
                    Crea il tuo primo preventivo in 20 secondi. Gratis, nessuna carta.
                  </p>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block w-full sm:w-auto">
                    <Link
                      href="/register"
                      className="flex sm:inline-flex items-center justify-center gap-2 sm:gap-3 bg-[#5c32e6] hover:bg-[#4f2bcc] text-white font-bold px-6 sm:px-10 py-4 sm:py-5 rounded-2xl text-sm sm:text-lg transition-all shadow-2xl shadow-[#5c32e6]/30 hover:shadow-[#5c32e6]/50 min-h-[52px]"
                    >
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <span>Crea il tuo primo preventivo in 20s</span>
                      <ArrowRight className="w-5 h-5 shrink-0" />
                    </Link>
                  </motion.div>
                  <p className="text-white/25 text-sm mt-5">
                    Gratis per sempre · Nessuna carta · Attivazione in 30 secondi
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black tracking-tight text-white/60">Preventivo</span>
            <span className="text-sm font-black tracking-tight text-[#a78bfa]">Veloce</span>
          </div>
          <p className="text-xs text-white/25">© 2026 Preventivo Veloce. Tutti i diritti riservati.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Termini', 'Accedi'].map((label, i) => (
              <Link
                key={label}
                href={i === 2 ? '/login' : `/${label.toLowerCase().replace(' ', '-')}`}
                className="text-xs text-white/25 hover:text-white/55 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
