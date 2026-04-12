# Design Spec: Nascondi Logo PDF + Sezione Categorie Landing

**Data:** 2026-04-12  
**Autore:** Federico Lardieri  
**Stato:** Approvato

---

## Panoramica

Due feature indipendenti:

1. **Nascondi logo Preventivo Veloce nel PDF** — checkbox nel ThemeCustomizer per non iniettare il logo di fallback nel PDF
2. **Sezione categorie in landing + pagine dedicate** — 8 pagine SEO per settore professionale, con sezione griglia nella home

---

## Feature 1 — Nascondi logo nel PDF

### Problema

In `src/app/api/pdf/route.ts`, la funzione `normalizeQuote` inietta automaticamente `/public/logo.png` (logo Preventivo Veloce) come logo mittente quando l'utente non ha caricato un logo proprio (righe 16-25). L'utente non ha modo di disabilitare questo comportamento.

### Soluzione

#### 1. Tipo `QuoteTheme` — `src/types/quote.ts`

Aggiungere il campo opzionale:

```ts
hideLogo?: boolean;
```

#### 2. API PDF — `src/app/api/pdf/route.ts`

In `normalizeQuote`, modificare la logica del logo di default:

```ts
let logo = raw.sender?.logo;
if (!logo && !raw.theme?.hideLogo) {
  // inietta logo.png solo se hideLogo è false/undefined
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoBuffer = await fs.readFile(logoPath);
    logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (e) {
    logError('pdf.default-logo', e);
  }
}
```

Se l'utente ha caricato un logo proprio (`raw.sender?.logo` è valorizzato), il logo proprio viene sempre mostrato indipendentemente da `hideLogo`.

#### 3. ThemeCustomizer — `src/components/quote/ThemeCustomizer.tsx`

Aggiungere una checkbox nella sezione "Logo", visibile **solo** quando `currentQuote.sender?.logo` è assente (ovvero quando il fallback sarebbe attivo):

- Label: **"Nascondi logo Preventivo Veloce"**
- Comportamento: `updateTheme({ hideLogo: !theme.hideLogo })`
- Posizione: sotto le opzioni di posizione/forma logo esistenti

#### 4. Nessuna migrazione DB

`theme` è già un campo JSONB in Supabase. `hideLogo` si serializza/deserializza automaticamente senza migration.

### Comportamento atteso

| Scenario | Risultato |
|---|---|
| Nessun logo caricato, `hideLogo: false` (default) | Logo Preventivo Veloce nel PDF |
| Nessun logo caricato, `hideLogo: true` | Nessun logo nel PDF |
| Logo caricato dall'utente, qualsiasi `hideLogo` | Logo utente nel PDF (invariato) |

---

## Feature 2 — Sezione categorie landing + pagine dedicate

### Categorie (8)

| Slug | Titolo |
|---|---|
| `preventivo-edilizia` | Edilizia |
| `preventivo-sviluppo-web` | Sviluppo Web |
| `preventivo-design` | Grafico & Design |
| `preventivo-consulenza` | Consulenza |
| `preventivo-idraulico` | Idraulico |
| `preventivo-elettricista` | Elettricista |
| `preventivo-fotografo` | Fotografo |
| `preventivo-marketing` | Marketing Digitale |

### Struttura file

```
src/app/(marketing)/
├── preventivo-edilizia/page.tsx
├── preventivo-sviluppo-web/page.tsx
├── preventivo-design/page.tsx
├── preventivo-consulenza/page.tsx
├── preventivo-idraulico/page.tsx
├── preventivo-elettricista/page.tsx
├── preventivo-fotografo/page.tsx
├── preventivo-marketing/page.tsx
└── _components/
    └── CategoryPage.tsx

src/lib/category-config.ts
```

### `src/lib/category-config.ts`

Ogni categoria esporta un oggetto `CategoryConfig`:

```ts
interface CategoryConfig {
  slug: string;
  title: string;               // es. "Edilizia"
  headline: string;            // es. "Preventivi per lavori edili in 20 secondi"
  description: string;         // paragrafo hero
  icon: LucideIcon;
  color: string;               // hex accent per la pagina
  exampleItems: {              // voci di preventivo tipiche
    description: string;
    quantity: number;
    unitPrice: number;         // in centesimi
    vatRate: number;
  }[];
  benefits: {                  // 3 benefici specifici
    title: string;
    description: string;
  }[];
  metadata: {
    title: string;
    description: string;
  };
}
```

### `src/app/(marketing)/_components/CategoryPage.tsx`

Componente React che accetta `CategoryConfig` e renderizza:

1. **Navbar** — riutilizzare il componente `Navbar` già presente in `page.tsx` (estrarlo o duplicarlo)
2. **Hero** — titolo categoria, sottotitolo, CTA "Inizia gratis → /register"
3. **Esempio preventivo** — card mockup con 3-4 voci tipiche della categoria, totale, badge template
4. **3 benefici** — griglia 3 colonne, icone Lucide, testo specifico per categoria
5. **CTA finale** — stessa sezione finale della landing principale
6. **Footer** — riutilizzare il footer della landing

Ogni `page.tsx` di categoria è una wrapper minima:

```tsx
import { CategoryPage } from '../_components/CategoryPage';
import { ediliziaConfig } from '@/lib/category-config';

export const metadata = ediliziaConfig.metadata;
export default function Page() {
  return <CategoryPage config={ediliziaConfig} />;
}
```

### Sezione `<PerSettore>` in `page.tsx`

Nuova sezione inserita dopo la sezione "features" (`id="features"`), prima dei testimonial.

- Titolo: "Preventivi per ogni settore"
- Sottotitolo: breve testo
- Griglia: 8 card (4 colonne su desktop, 2 su tablet, 1 su mobile)
- Ogni card: icona + nome categoria + freccia → link alla pagina dedicata
- Stile: coerente con il resto — sfondo `white/[0.04]`, bordo `white/5`, hover con accent violet, `FadeIn` animation già presente

### SEO

Ogni pagina ha:
- `export const metadata` con title ottimizzato: `"Preventivo [Categoria] gratis | Preventivo Veloce"`
- `description` ottimizzata per ricerca locale (es. "Crea preventivi per lavori edili in 20 secondi con AI...")
- Le pagine sono statiche (SSG) — nessuna chiamata DB, massima performance

### Stile

- **Non deviare** dallo stile esistente della landing: dark background `#0a0a0f`, violet accent `#a78bfa`/`#5c32e6`, glassmorphism, Framer Motion `FadeIn`
- Riutilizzare esattamente i pattern di animazione, colori, border già presenti in `page.tsx`
- Il `Navbar` della landing va estratto come componente condiviso per non duplicare codice

---

## Dipendenze tra feature

Le due feature sono **completamente indipendenti** e possono essere implementate in parallelo o in sequenza.

## Test

- **Feature 1**: Verificare manualmente che il PDF non mostri il logo quando `hideLogo: true` e nessun logo utente è presente. Verificare che il logo utente non sia mai nascosto.
- **Feature 2**: Verificare che tutte le 8 pagine siano raggiungibili, che i metadata siano corretti, che la griglia in home linki correttamente.
