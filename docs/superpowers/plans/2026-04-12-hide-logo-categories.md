# Hide Logo + Categorie Landing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere checkbox per nascondere il logo di default nel PDF, e creare sezione categorie nella landing page con 8 pagine SEO dedicate.

**Architecture:** Feature 1 modifica il tipo `QuoteTheme`, l'API PDF e il `ThemeCustomizer`. Feature 2 crea un config file, un componente condiviso `CategoryPage`, 8 pagine statiche e una nuova sezione nella landing. Le due feature sono indipendenti.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, @react-pdf/renderer, Vitest, Framer Motion, Lucide React

---

## File Map

**Feature 1 — Nascondi logo**
- Modify: `src/types/quote.ts` — aggiunge `hideLogo?: boolean` a `QuoteTheme`
- Modify: `src/app/api/pdf/route.ts` — guard in `normalizeQuote`
- Modify: `src/components/quote/ThemeCustomizer.tsx` — checkbox UI
- Modify: `src/app/api/pdf/route.test.ts` — nuovo test per `hideLogo`

**Feature 2 — Categorie**
- Create: `src/lib/category-config.ts` — dati per 8 categorie
- Create: `src/app/(marketing)/_components/Navbar.tsx` — Navbar estratta
- Create: `src/app/(marketing)/_components/CategoryPage.tsx` — componente condiviso
- Create: `src/app/(marketing)/preventivo-edilizia/page.tsx`
- Create: `src/app/(marketing)/preventivo-sviluppo-web/page.tsx`
- Create: `src/app/(marketing)/preventivo-design/page.tsx`
- Create: `src/app/(marketing)/preventivo-consulenza/page.tsx`
- Create: `src/app/(marketing)/preventivo-idraulico/page.tsx`
- Create: `src/app/(marketing)/preventivo-elettricista/page.tsx`
- Create: `src/app/(marketing)/preventivo-fotografo/page.tsx`
- Create: `src/app/(marketing)/preventivo-marketing/page.tsx`
- Modify: `src/app/(marketing)/page.tsx` — aggiunge sezione `<PerSettore>` e usa `Navbar` estratta

---

## Task 1 — Aggiungi `hideLogo` al tipo `QuoteTheme`

**Files:**
- Modify: `src/types/quote.ts:22-36`

- [ ] **Step 1: Aggiungi il campo al tipo**

In `src/types/quote.ts`, modifica l'interfaccia `QuoteTheme` aggiungendo `hideLogo` dopo `showPaymentTerms`:

```ts
export interface QuoteTheme {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: FontFamily;
  tableStyle: TableStyle;
  logoPosition: LogoPosition;
  logoShape?: LogoShape;
  logoScale?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
  logoPadding?: number;
  showFooterNotes: boolean;
  showPaymentTerms: boolean;
  hideLogo?: boolean;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add src/types/quote.ts
git commit -m "feat: add hideLogo field to QuoteTheme"
```

---

## Task 2 — Guard in `normalizeQuote` + test

**Files:**
- Modify: `src/app/api/pdf/route.ts:15-25`
- Modify: `src/app/api/pdf/route.test.ts`

- [ ] **Step 1: Scrivi il test prima**

Aggiungi questo test in fondo al blocco `describe('POST /api/pdf', ...)` in `src/app/api/pdf/route.test.ts`:

```ts
it('does not inject default logo when hideLogo is true', async () => {
  const { generatePDF } = await import('@/pdf/generatePDF');

  const body = makeQuoteBody({
    theme: {
      primaryColor: '#5c32e6',
      accentColor: '#1d4ed8',
      textColor: '#1e293b',
      fontFamily: 'Helvetica',
      tableStyle: 'striped',
      logoPosition: 'left',
      showFooterNotes: true,
      showPaymentTerms: true,
      hideLogo: true,
    },
    sender: {
      name: 'Test',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      vatNumber: '',
      email: '',
      phone: '',
      // no logo
    },
  });

  const res = await POST(makeRequest(body));
  expect(res.status).toBe(200);

  const calls = vi.mocked(generatePDF).mock.calls;
  const lastCall = calls[calls.length - 1];
  const quote = lastCall[0];
  expect(quote.sender.logo).toBeUndefined();
});
```

- [ ] **Step 2: Esegui il test per verificare che fallisca**

```bash
npm run test -- src/app/api/pdf/route.test.ts
```

Expected: il nuovo test FAIL perché attualmente il logo viene sempre iniettato.

- [ ] **Step 3: Modifica `normalizeQuote` per rispettare `hideLogo`**

In `src/app/api/pdf/route.ts`, cambia le righe 15-25:

```ts
// Default logo logic
let logo = raw.sender?.logo;
if (!logo && !raw.theme?.hideLogo) {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBuffer = await fs.readFile(logoPath);
    logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (e) {
    logError('pdf.default-logo', e);
  }
}
```

- [ ] **Step 4: Esegui i test per verificare che passino**

```bash
npm run test -- src/app/api/pdf/route.test.ts
```

Expected: tutti i test PASS, incluso il nuovo.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/pdf/route.ts src/app/api/pdf/route.test.ts
git commit -m "feat: skip default logo injection when hideLogo is true"
```

---

## Task 3 — Checkbox nel ThemeCustomizer

**Files:**
- Modify: `src/components/quote/ThemeCustomizer.tsx`

- [ ] **Step 1: Sostituisci il contenuto del file**

Il `ThemeCustomizer.tsx` attuale gestisce solo colori. Aggiungi la sezione logo in fondo al `<div className="space-y-4">`:

```tsx
"use client";

import { useQuoteStore } from "@/store/quoteStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function ThemeCustomizer() {
  const { currentQuote, updateTheme } = useQuoteStore();

  if (!currentQuote) return null;

  const hasUserLogo = Boolean(currentQuote.sender?.logo);

  return (
    <Card className="shadow-sm border-slate-200 mt-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Colore Primario</Label>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-12 h-12 p-1 rounded-md border-2"
                    style={{ backgroundColor: currentQuote.theme.primaryColor, borderColor: currentQuote.theme.primaryColor }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={currentQuote.theme.primaryColor}
                    onChange={(hex) => updateTheme({ primaryColor: hex })}
                  />
                </PopoverContent>
              </Popover>
              <Input
                value={currentQuote.theme.primaryColor.toUpperCase()}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                className="w-28 font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Colore Secondario (Accento)</Label>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-12 h-12 p-1 rounded-md border-2"
                    style={{ backgroundColor: currentQuote.theme.accentColor, borderColor: currentQuote.theme.accentColor }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <HexColorPicker
                    color={currentQuote.theme.accentColor}
                    onChange={(hex) => updateTheme({ accentColor: hex })}
                  />
                </PopoverContent>
              </Popover>
              <Input
                value={currentQuote.theme.accentColor.toUpperCase()}
                onChange={(e) => updateTheme({ accentColor: e.target.value })}
                className="w-28 font-mono"
              />
            </div>
          </div>

          {!hasUserLogo && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                id="hideLogo"
                checked={currentQuote.theme.hideLogo ?? false}
                onChange={(e) => updateTheme({ hideLogo: e.target.checked })}
                className="w-4 h-4 accent-[#5c32e6] cursor-pointer"
              />
              <Label htmlFor="hideLogo" className="cursor-pointer text-sm font-medium text-slate-600">
                Nascondi logo Preventivo Veloce nel PDF
              </Label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add src/components/quote/ThemeCustomizer.tsx
git commit -m "feat: add hide-logo checkbox to ThemeCustomizer"
```

---

## Task 4 — Crea `category-config.ts`

**Files:**
- Create: `src/lib/category-config.ts`

- [ ] **Step 1: Crea il file di configurazione**

```ts
import {
  HardHat, Code2, Palette, Briefcase, Wrench, Zap, Camera, TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CategoryBenefit {
  title: string;
  description: string;
}

export interface CategoryExampleItem {
  description: string;
  quantity: number;
  unitPrice: number; // in centesimi
  vatRate: number;
}

export interface CategoryConfig {
  slug: string;
  title: string;
  headline: string;
  description: string;
  icon: LucideIcon;
  color: string;
  colorMuted: string;
  exampleItems: CategoryExampleItem[];
  benefits: CategoryBenefit[];
  metadata: {
    title: string;
    description: string;
  };
}

export const categories: CategoryConfig[] = [
  {
    slug: 'preventivo-edilizia',
    title: 'Edilizia',
    headline: 'Preventivi per lavori edili in 20 secondi',
    description: 'Smetti di perdere clienti mentre compili fogli Excel. Genera preventivi professionali per ristrutturazioni, muratura e impiantistica in meno di un minuto.',
    icon: HardHat,
    color: '#f59e0b',
    colorMuted: 'rgba(245,158,11,0.12)',
    exampleItems: [
      { description: 'Mano d\'opera muratura', quantity: 8, unitPrice: 4500_00, vatRate: 22 },
      { description: 'Materiali da costruzione', quantity: 1, unitPrice: 1800_00, vatRate: 22 },
      { description: 'Smaltimento macerie', quantity: 1, unitPrice: 350_00, vatRate: 22 },
      { description: 'Fornitura e posa piastrelle', quantity: 30, unitPrice: 28_00, vatRate: 22 },
    ],
    benefits: [
      { title: 'IVA edilizia automatica', description: 'Calcolo automatico dell\'IVA al 10% per ristrutturazioni e al 22% per nuove costruzioni. Zero errori.' },
      { title: 'PDF da cantiere', description: 'Genera il PDF dal telefono direttamente in cantiere. Il cliente lo riceve via email in 20 secondi.' },
      { title: 'Storico lavori', description: 'Tutti i preventivi per cantiere in un unico posto. Filtra per cliente, stato e importo.' },
    ],
    metadata: {
      title: 'Preventivo Edilizia Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per lavori edili, ristrutturazioni e muratura in 20 secondi con AI. PDF con logo, IVA automatica. Gratis.',
    },
  },
  {
    slug: 'preventivo-sviluppo-web',
    title: 'Sviluppo Web',
    headline: 'Preventivi per progetti web in 20 secondi',
    description: 'Smetti di perdere ore a formattare preventivi in Word. Descrivi il progetto in italiano, l\'AI genera voci, ore e totali — tu mandi al cliente.',
    icon: Code2,
    color: '#6366f1',
    colorMuted: 'rgba(99,102,241,0.12)',
    exampleItems: [
      { description: 'Sviluppo frontend React', quantity: 40, unitPrice: 75_00, vatRate: 22 },
      { description: 'Backend API Node.js', quantity: 20, unitPrice: 80_00, vatRate: 22 },
      { description: 'Design UI/UX', quantity: 10, unitPrice: 65_00, vatRate: 22 },
      { description: 'Deploy e configurazione server', quantity: 1, unitPrice: 500_00, vatRate: 22 },
    ],
    benefits: [
      { title: 'Voci tecniche precompilate', description: 'L\'AI conosce i termini del settore: frontend, backend, API, deployment. Niente traduzione manuale.' },
      { title: 'Accettazione digitale', description: 'Il cliente accetta il preventivo con un click dall\'email. Nessuna firma cartacea.' },
      { title: 'Template professional', description: 'Layout moderno e pulito che trasmette professionalità — esattamente quello che un cliente tech si aspetta.' },
    ],
    metadata: {
      title: 'Preventivo Sviluppo Web Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per progetti web, app e e-commerce in 20 secondi con AI. PDF con logo, IVA automatica. Gratis.',
    },
  },
  {
    slug: 'preventivo-design',
    title: 'Grafico & Design',
    headline: 'Preventivi per progetti grafici in 20 secondi',
    description: 'Il tuo lavoro è visivo — anche il preventivo deve esserlo. Template eleganti, colori brand, PDF che il cliente non butterà via.',
    icon: Palette,
    color: '#ec4899',
    colorMuted: 'rgba(236,72,153,0.12)',
    exampleItems: [
      { description: 'Progettazione logo e brand identity', quantity: 1, unitPrice: 1200_00, vatRate: 22 },
      { description: 'Materiale stampa (biglietti, brochure)', quantity: 1, unitPrice: 600_00, vatRate: 22 },
      { description: 'Social media kit (12 template)', quantity: 1, unitPrice: 450_00, vatRate: 22 },
      { description: 'Revisioni incluse', quantity: 3, unitPrice: 0, vatRate: 22 },
    ],
    benefits: [
      { title: 'PDF che riflette il tuo stile', description: '8 template premium con colori personalizzabili. Il preventivo è già un\'anteprima del tuo lavoro.' },
      { title: 'Logo tuo in evidenza', description: 'Il tuo logo in alto, grande. Il cliente sa subito con chi sta parlando.' },
      { title: 'Prezzi flessibili', description: 'Pacchetti, ore, voci fisse o variabili. Ogni struttura tariffaria è supportata.' },
    ],
    metadata: {
      title: 'Preventivo Grafico e Design Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per logo, brand identity e grafica in 20 secondi con AI. PDF elegante con logo. Gratis.',
    },
  },
  {
    slug: 'preventivo-consulenza',
    title: 'Consulenza',
    headline: 'Preventivi per servizi di consulenza in 20 secondi',
    description: 'I tuoi clienti si aspettano precisione. Un preventivo chiaro, professionale e senza errori è il primo segnale che sai il fatto tuo.',
    icon: Briefcase,
    color: '#0ea5e9',
    colorMuted: 'rgba(14,165,233,0.12)',
    exampleItems: [
      { description: 'Analisi e diagnosi aziendale', quantity: 8, unitPrice: 150_00, vatRate: 22 },
      { description: 'Piano strategico documentato', quantity: 1, unitPrice: 2000_00, vatRate: 22 },
      { description: 'Sessioni di follow-up (mensili)', quantity: 4, unitPrice: 300_00, vatRate: 22 },
    ],
    benefits: [
      { title: 'Termini di pagamento chiari', description: 'Aggiungi condizioni di pagamento, IBAN e note contrattuali direttamente nel PDF.' },
      { title: 'Tracciamento stato', description: 'Bozza, inviato, accettato, rifiutato. Sai sempre dove si trova ogni proposta.' },
      { title: 'Storico per cliente', description: 'Rubrica clienti integrata. Tutti i preventivi per ciascun cliente in un click.' },
    ],
    metadata: {
      title: 'Preventivo Consulenza Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per servizi di consulenza aziendale e strategica in 20 secondi con AI. PDF professionale. Gratis.',
    },
  },
  {
    slug: 'preventivo-idraulico',
    title: 'Idraulico',
    headline: 'Preventivi per lavori idraulici in 20 secondi',
    description: 'Sei sul cantiere, non in ufficio. Genera il preventivo dal telefono in 20 secondi e mandalo al cliente prima che chiami il tuo concorrente.',
    icon: Wrench,
    color: '#06b6d4',
    colorMuted: 'rgba(6,182,212,0.12)',
    exampleItems: [
      { description: 'Sostituzione impianto idrico bagno', quantity: 1, unitPrice: 850_00, vatRate: 22 },
      { description: 'Mano d\'opera', quantity: 6, unitPrice: 55_00, vatRate: 22 },
      { description: 'Materiali e raccorderia', quantity: 1, unitPrice: 320_00, vatRate: 22 },
      { description: 'Intervento urgenza (tariffa notturna)', quantity: 1, unitPrice: 180_00, vatRate: 22 },
    ],
    benefits: [
      { title: 'Dal telefono in 20 secondi', description: 'App web ottimizzata per mobile. Descrivi il lavoro a voce, l\'AI compila il preventivo.' },
      { title: 'Prezzi materiali separati', description: 'Voce manodopera + voce materiali sempre separati e chiari per il cliente.' },
      { title: 'IVA al 10% con un click', description: 'Manutenzione straordinaria? Imposti l\'IVA ridotta in un secondo.' },
    ],
    metadata: {
      title: 'Preventivo Idraulico Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per lavori idraulici e impianti in 20 secondi con AI. PDF dal cellulare. Gratis.',
    },
  },
  {
    slug: 'preventivo-elettricista',
    title: 'Elettricista',
    headline: 'Preventivi per lavori elettrici in 20 secondi',
    description: 'Meno tempo a scrivere, più tempo a lavorare. Il preventivo parte dall\'impianto — non dal PC.',
    icon: Zap,
    color: '#eab308',
    colorMuted: 'rgba(234,179,8,0.12)',
    exampleItems: [
      { description: 'Rifacimento impianto elettrico civile', quantity: 1, unitPrice: 1800_00, vatRate: 22 },
      { description: 'Installazione quadro elettrico', quantity: 1, unitPrice: 650_00, vatRate: 22 },
      { description: 'Mano d\'opera', quantity: 12, unitPrice: 50_00, vatRate: 22 },
      { description: 'Certificazione impianto', quantity: 1, unitPrice: 250_00, vatRate: 22 },
    ],
    benefits: [
      { title: 'Genera da cantiere', description: 'Apri dal telefono, descrivi l\'impianto, invia il PDF. Il cliente risponde prima che tu salga sull\'autocarro.' },
      { title: 'Voci standard precompilate', description: 'Manodopera, materiali, certificazioni, urgenze. L\'AI sa già come strutturare un preventivo elettrico.' },
      { title: 'Nessun errore di calcolo', description: 'IVA, sconti e totale calcolati al centesimo. Mai più imbarazzi con il cliente.' },
    ],
    metadata: {
      title: 'Preventivo Elettricista Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per lavori elettrici e impianti in 20 secondi con AI. PDF dal cellulare. Gratis.',
    },
  },
  {
    slug: 'preventivo-fotografo',
    title: 'Fotografo',
    headline: 'Preventivi per servizi fotografici in 20 secondi',
    description: 'Le tue foto sono perfette. Il preventivo dovrebbe esserlo altrettanto. Template eleganti, PDF professionale, accettazione digitale.',
    icon: Camera,
    color: '#8b5cf6',
    colorMuted: 'rgba(139,92,246,0.12)',
    exampleItems: [
      { description: 'Servizio fotografico aziendale (mezza giornata)', quantity: 1, unitPrice: 900_00, vatRate: 22 },
      { description: 'Post-produzione e ritocco (50 foto)', quantity: 1, unitPrice: 400_00, vatRate: 22 },
      { description: 'Consegna file alta risoluzione', quantity: 1, unitPrice: 0, vatRate: 22 },
      { description: 'Diritti d\'uso commerciale', quantity: 1, unitPrice: 300_00, vatRate: 22 },
    ],
    benefits: [
      { title: 'PDF visivamente curato', description: '8 template eleganti che comunicano estetica e cura — esattamente come le tue foto.' },
      { title: 'Diritti d\'uso nel preventivo', description: 'Aggiungi clausole su diritti d\'uso, licenze e consegne direttamente nelle note del PDF.' },
      { title: 'Accettazione digitale', description: 'Il cliente firma il preventivo con un click dall\'email. Nessun documento cartaceo.' },
    ],
    metadata: {
      title: 'Preventivo Fotografo Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per servizi fotografici e video in 20 secondi con AI. PDF elegante con logo. Gratis.',
    },
  },
  {
    slug: 'preventivo-marketing',
    title: 'Marketing Digitale',
    headline: 'Preventivi per servizi marketing in 20 secondi',
    description: 'Vendi strategie digitali — il tuo processo dovrebbe riflettere la tua competenza. Un preventivo generato con AI in 20 secondi dice tutto.',
    icon: TrendingUp,
    color: '#10b981',
    colorMuted: 'rgba(16,185,129,0.12)',
    exampleItems: [
      { description: 'Gestione campagne Google Ads (mensile)', quantity: 3, unitPrice: 800_00, vatRate: 22 },
      { description: 'Strategia e content social media', quantity: 3, unitPrice: 600_00, vatRate: 22 },
      { description: 'SEO on-page + audit', quantity: 1, unitPrice: 1200_00, vatRate: 22 },
      { description: 'Report mensile analytics', quantity: 3, unitPrice: 150_00, vatRate: 22 },
    ],
    benefits: [
      { title: 'Struttura per pacchetti', description: 'Setup, gestione mensile, report. Ogni pacchetto come voce separata con IVA corretta.' },
      { title: 'Invio tracciato via email', description: 'Sai quando il cliente apre il preventivo. Sai quando lo accetta. Sei sempre un passo avanti.' },
      { title: 'Aspetto da agenzia', description: 'Template Executive o Corporate per proporre prezzi premium con la credibilità che meritano.' },
    ],
    metadata: {
      title: 'Preventivo Marketing Digitale Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per servizi marketing digitale, SEO e social media in 20 secondi con AI. Gratis.',
    },
  },
];

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return categories.find((c) => c.slug === slug);
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add src/lib/category-config.ts
git commit -m "feat: add category config for 8 professional sectors"
```

---

## Task 5 — Estrai `Navbar` come componente condiviso

**Files:**
- Create: `src/app/(marketing)/_components/Navbar.tsx`
- Modify: `src/app/(marketing)/page.tsx` — rimuovi la funzione `Navbar` locale e importa quella nuova

- [ ] **Step 1: Crea `src/app/(marketing)/_components/Navbar.tsx`**

```tsx
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
```

- [ ] **Step 2: Aggiorna `page.tsx` per usare il componente estratto**

In `src/app/(marketing)/page.tsx`:
1. Aggiungi l'import: `import { Navbar } from './_components/Navbar';`
2. Rimuovi l'intera funzione `Navbar` locale (righe 108-162)
3. Nei nav link interni della landing usa `#features`, `#come-funziona`, etc. (senza `/`) perché `page.tsx` è già sulla root — oppure lascia `/#` che funziona uguale

- [ ] **Step 3: Typecheck + build**

```bash
npm run typecheck
```

Expected: nessun errore.

- [ ] **Step 4: Commit**

```bash
git add src/app/(marketing)/_components/Navbar.tsx src/app/(marketing)/page.tsx
git commit -m "refactor: extract Navbar to shared marketing component"
```

---

## Task 6 — Crea `CategoryPage.tsx` componente condiviso

**Files:**
- Create: `src/app/(marketing)/_components/CategoryPage.tsx`

- [ ] **Step 1: Crea il componente**

```tsx
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
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add src/app/(marketing)/_components/CategoryPage.tsx
git commit -m "feat: add shared CategoryPage component"
```

---

## Task 7 — Crea le 8 pagine di categoria

**Files:**
- Create: `src/app/(marketing)/preventivo-edilizia/page.tsx`
- Create: `src/app/(marketing)/preventivo-sviluppo-web/page.tsx`
- Create: `src/app/(marketing)/preventivo-design/page.tsx`
- Create: `src/app/(marketing)/preventivo-consulenza/page.tsx`
- Create: `src/app/(marketing)/preventivo-idraulico/page.tsx`
- Create: `src/app/(marketing)/preventivo-elettricista/page.tsx`
- Create: `src/app/(marketing)/preventivo-fotografo/page.tsx`
- Create: `src/app/(marketing)/preventivo-marketing/page.tsx`

- [ ] **Step 1: Crea tutte le 8 pagine**

Ogni file ha questa struttura (sostituisci `ediliziaConfig` con il nome della categoria e lo slug corrispondente). Crea tutti e 8 i file:

**`src/app/(marketing)/preventivo-edilizia/page.tsx`**
```tsx
import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-edilizia')!;

export const metadata: Metadata = config.metadata;

export default function Page() {
  return <CategoryPage config={config} />;
}
```

**`src/app/(marketing)/preventivo-sviluppo-web/page.tsx`**
```tsx
import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-sviluppo-web')!;

export const metadata: Metadata = config.metadata;

export default function Page() {
  return <CategoryPage config={config} />;
}
```

**`src/app/(marketing)/preventivo-design/page.tsx`**
```tsx
import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-design')!;

export const metadata: Metadata = config.metadata;

export default function Page() {
  return <CategoryPage config={config} />;
}
```

**`src/app/(marketing)/preventivo-consulenza/page.tsx`**
```tsx
import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-consulenza')!;

export const metadata: Metadata = config.metadata;

export default function Page() {
  return <CategoryPage config={config} />;
}
```

**`src/app/(marketing)/preventivo-idraulico/page.tsx`**
```tsx
import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-idraulico')!;

export const metadata: Metadata = config.metadata;

export default function Page() {
  return <CategoryPage config={config} />;
}
```

**`src/app/(marketing)/preventivo-elettricista/page.tsx`**
```tsx
import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-elettricista')!;

export const metadata: Metadata = config.metadata;

export default function Page() {
  return <CategoryPage config={config} />;
}
```

**`src/app/(marketing)/preventivo-fotografo/page.tsx`**
```tsx
import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-fotografo')!;

export const metadata: Metadata = config.metadata;

export default function Page() {
  return <CategoryPage config={config} />;
}
```

**`src/app/(marketing)/preventivo-marketing/page.tsx`**
```tsx
import { Metadata } from 'next';
import { CategoryPage } from '../_components/CategoryPage';
import { categories } from '@/lib/category-config';

const config = categories.find(c => c.slug === 'preventivo-marketing')!;

export const metadata: Metadata = config.metadata;

export default function Page() {
  return <CategoryPage config={config} />;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: nessun errore.

- [ ] **Step 3: Verifica che tutte le 8 pagine siano raggiungibili**

Avvia il dev server:
```bash
npm run dev
```

Visita manualmente:
- `http://localhost:3000/preventivo-edilizia`
- `http://localhost:3000/preventivo-sviluppo-web`
- `http://localhost:3000/preventivo-design`

Deve renderizzare la pagina senza errori.

- [ ] **Step 4: Commit**

```bash
git add src/app/(marketing)/preventivo-edilizia/ \
        src/app/(marketing)/preventivo-sviluppo-web/ \
        src/app/(marketing)/preventivo-design/ \
        src/app/(marketing)/preventivo-consulenza/ \
        src/app/(marketing)/preventivo-idraulico/ \
        src/app/(marketing)/preventivo-elettricista/ \
        src/app/(marketing)/preventivo-fotografo/ \
        src/app/(marketing)/preventivo-marketing/
git commit -m "feat: add 8 category landing pages for SEO"
```

---

## Task 8 — Aggiungi sezione `PerSettore` nella landing page

**Files:**
- Modify: `src/app/(marketing)/page.tsx`

- [ ] **Step 1: Aggiungi gli import necessari**

In `src/app/(marketing)/page.tsx`, aggiungi all'import di `lucide-react` esistente le icone delle categorie:

```ts
import {
  Zap, FileText, Sparkles, ArrowRight, Check, X,
  Play, Star, Clock, Download, Palette, ChevronRight,
  Timer, TrendingUp, Shield, Users, Mail, MailCheck, Send, Bell,
  HardHat, Code2, Briefcase, Wrench, Camera,
} from 'lucide-react';
```

Aggiungi anche l'import del config categorie subito dopo gli import esistenti:

```ts
import { categories } from '@/lib/category-config';
```

- [ ] **Step 2: Aggiungi la sezione `PerSettore` nel JSX**

In `src/app/(marketing)/page.tsx`, inserisci la sezione dopo `</section>` che chiude `id="email-flow"` (dopo la riga `</section>` di email-flow, prima di `{/* ── TESTIMONIALS ── */}`):

```tsx
      {/* ── PER SETTORE ── */}
      <section className="py-16 sm:py-20 md:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#5c32e6]/12 border border-[#5c32e6]/20 text-[#a78bfa] text-sm font-bold px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Per ogni settore
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Preventivi per il tuo<br />settore professionale
            </h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">
              Che tu sia un artigiano, un freelance o una PMI — Preventivo Veloce si adatta al tuo lavoro.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <FadeIn key={cat.slug} delay={i * 0.05}>
                  <motion.a
                    href={`/${cat.slug}`}
                    className="group flex flex-col items-start gap-3 bg-[#111118] border border-white/6 rounded-2xl p-5 hover:border-white/14 transition-all relative overflow-hidden hover:shadow-xl"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${cat.color}08, transparent)` }}
                    />
                    <div
                      className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: cat.colorMuted }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <div className="relative flex-1">
                      <p className="text-sm font-black text-white group-hover:text-white/90">{cat.title}</p>
                    </div>
                    <ChevronRight
                      className="relative w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all"
                    />
                  </motion.a>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: nessun errore.

- [ ] **Step 4: Verifica visiva**

```bash
npm run dev
```

Apri `http://localhost:3000`. Scorri fino alla sezione "Per settore" — deve mostrare 8 card con icone e link.

- [ ] **Step 5: Commit**

```bash
git add src/app/(marketing)/page.tsx
git commit -m "feat: add Per Settore section to landing page"
```

---

## Task 9 — Aggiorna sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Aggiungi le 8 URL alla sitemap**

Leggi il file attuale con `Read src/app/sitemap.ts`, poi aggiungi le route di categoria. La sitemap attuale probabilmente ha un array di URL statiche — aggiungi le 8 pagine categoria:

```ts
import { categories } from '@/lib/category-config';

// Dentro la funzione sitemap(), aggiungi alle URL esistenti:
...categories.map(cat => ({
  url: `${siteUrl}/${cat.slug}`,
  lastModified: new Date(),
  changeFrequency: 'monthly' as const,
  priority: 0.7,
})),
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add category pages to sitemap"
```

---

## Self-Review

**Spec coverage:**
- ✅ `hideLogo?: boolean` aggiunto a `QuoteTheme` (Task 1)
- ✅ Guard in `normalizeQuote` (Task 2)
- ✅ Checkbox in `ThemeCustomizer` visibile solo senza logo utente (Task 3)
- ✅ `category-config.ts` con 8 categorie (Task 4)
- ✅ `Navbar` estratta come componente condiviso (Task 5)
- ✅ `CategoryPage.tsx` condiviso con hero, esempio, benefici, CTA, footer (Task 6)
- ✅ 8 pagine con metadata SEO propri (Task 7)
- ✅ Sezione `PerSettore` nella landing (Task 8)
- ✅ Sitemap aggiornata (Task 9)

**Placeholder scan:** nessun TBD, nessun "implement later".

**Type consistency:** `CategoryConfig` definito in Task 4, usato in Task 6 e 7. `hideLogo: boolean` definito in Task 1, letto in Task 2 come `raw.theme?.hideLogo`, scritto in Task 3 come `updateTheme({ hideLogo: e.target.checked })` — consistente.
