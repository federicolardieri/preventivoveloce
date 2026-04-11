# Responsive Mobile Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere responsive (≤ 1024px) le pagine principali di Preventivo Veloce — QuoteEditor (priorità), landing, login/register, dashboard — senza cambiare layout/stile desktop né toccare alcun file di sicurezza/auth/middleware.

**Architecture:** Fix chirurgico per file con classi Tailwind responsive (`sm:`, `md:`, `lg:`), mobile-first. Nessuna astrazione condivisa, nessun refactor strutturale. Verifica visiva via script Playwright throwaway che cattura screenshot a 3 viewport (375/768/1440) per documentare before/after.

**Tech Stack:** Next.js App Router + TypeScript, Tailwind CSS v4, framer-motion, shadcn/ui, `@playwright/test` (devDependency dev-only per verifica screenshot).

**Spec di riferimento:** [docs/superpowers/specs/2026-04-11-responsive-mobile-design.md](../specs/2026-04-11-responsive-mobile-design.md)

**Guardrail di sicurezza (MAI toccare durante il lavoro):**
- `src/middleware.ts`, `src/lib/supabase/*`
- `src/app/api/**`
- Server Actions, auth flow logic (solo UI)
- Migration SQL, RLS policy, Supabase config
- `.env*`, `next.config.js`, `tsconfig.json`, `tailwind.config.js` (niente nuovi breakpoint)

---

## Fase 0 — Setup Playwright throwaway

### Task 0.1: Installare `@playwright/test` come devDependency

**Files:**
- Modify: `package.json` (sezione `devDependencies`)
- Modify: `.gitignore`
- Create: `scripts/responsive-check.ts`
- Create: `scripts/README-responsive.md` (nota breve su come eseguirlo)

**Perché serve (eccezione al "no new deps"):** tool dev-only per screenshot, mai importato da codice runtime, verrà rimosso dalla devDependency a fine lavoro nel task di cleanup finale.

- [ ] **Step 1: Installare Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected: `@playwright/test` aggiunto in `package.json` devDependencies; Chromium scaricato.

- [ ] **Step 2: Aggiungere `.responsive-screenshots/` a `.gitignore`**

Aprire `.gitignore` e aggiungere in fondo:

```
# responsive check screenshots (throwaway)
/.responsive-screenshots/
```

- [ ] **Step 3: Creare `scripts/responsive-check.ts`**

File esatto:

```typescript
import { chromium, devices, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL || '';
const PASSWORD = process.env.TEST_PASSWORD || '';
const OUT_DIR = '.responsive-screenshots';

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

// Routes grouped by auth requirement
const PUBLIC_ROUTES = ['/', '/login', '/register'];
const AUTH_ROUTES = ['/dashboard', '/nuovo', '/preventivi', '/preventivi/archivio', '/clienti', '/impostazioni'];

async function login(page: Page) {
  if (!EMAIL || !PASSWORD) throw new Error('TEST_EMAIL / TEST_PASSWORD env vars required for auth routes');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

async function shoot(page: Page, route: string, viewport: typeof VIEWPORTS[number], label: string) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
  // give animations time to settle
  await page.waitForTimeout(800);
  const safeRoute = route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '_');
  const dir = join(OUT_DIR, label, safeRoute);
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${viewport.name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log(`  ✓ ${route} @ ${viewport.name} → ${path}`);
}

async function main() {
  const label = process.argv[2] || 'run';
  const onlyRoute = process.argv[3]; // optional: single route override
  console.log(`📸 Responsive screenshots — label: "${label}"`);

  const browser = await chromium.launch();

  // Public routes (no auth)
  const publicCtx = await browser.newContext();
  const publicPage = await publicCtx.newPage();
  const publicRoutes = onlyRoute ? PUBLIC_ROUTES.filter((r) => r === onlyRoute) : PUBLIC_ROUTES;
  for (const route of publicRoutes) {
    for (const vp of VIEWPORTS) await shoot(publicPage, route, vp, label);
  }
  await publicCtx.close();

  // Authenticated routes
  const authRoutes = onlyRoute ? AUTH_ROUTES.filter((r) => r === onlyRoute) : AUTH_ROUTES;
  if (authRoutes.length > 0) {
    const authCtx = await browser.newContext();
    const authPage = await authCtx.newPage();
    await login(authPage);
    for (const route of authRoutes) {
      for (const vp of VIEWPORTS) await shoot(authPage, route, vp, label);
    }
    await authCtx.close();
  }

  await browser.close();
  console.log(`\nDone. Screenshots saved under ${OUT_DIR}/${label}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Creare `scripts/README-responsive.md`**

```markdown
# Responsive Check Script

Throwaway script per catturare screenshot responsive durante il lavoro di fix mobile.

## Uso

1. Avviare il dev server in un terminale:
   ```bash
   npm run dev
   ```

2. In un altro terminale, lanciare lo script:
   ```bash
   TEST_EMAIL=... TEST_PASSWORD=... npx tsx scripts/responsive-check.ts <label> [route]
   ```

   Esempi:
   - `npx tsx scripts/responsive-check.ts baseline` → tutte le route, salva in `.responsive-screenshots/baseline/`
   - `npx tsx scripts/responsive-check.ts after-quote-editor /nuovo` → solo `/nuovo`

## Output

`.responsive-screenshots/<label>/<route>/<viewport>.png`

La directory `.responsive-screenshots/` è in `.gitignore`.

## Cleanup

Questo script verrà rimosso (insieme a `@playwright/test` devDependency) al completamento del lavoro responsive.
```

- [ ] **Step 5: Installare `tsx` se non presente (per eseguire TS direttamente)**

```bash
npx tsx --version 2>/dev/null || npm install --save-dev tsx
```

Expected: `tsx` già presente oppure installato in devDependencies.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore scripts/responsive-check.ts scripts/README-responsive.md
git commit -m "chore: add throwaway Playwright responsive check script"
```

---

### Task 0.2: Catturare baseline screenshots

**Files:** nessuna modifica al codice. Solo esecuzione script.

- [ ] **Step 1: Avviare dev server**

In un terminale separato (background):

```bash
npm run dev
```

Aspettare che mostri `Ready on http://localhost:3000`.

- [ ] **Step 2: Lanciare baseline screenshot**

```bash
TEST_EMAIL=fe.developer22@gmail.com TEST_PASSWORD=Test1234! npx tsx scripts/responsive-check.ts baseline
```

Expected: file creati in `.responsive-screenshots/baseline/` per ogni route × 3 viewport.

- [ ] **Step 3: Review mentale degli screenshot**

Aprire almeno queste immagini per identificare i problemi:
- `.responsive-screenshots/baseline/nuovo/mobile-375.png` (la priorità)
- `.responsive-screenshots/baseline/root/mobile-375.png`
- `.responsive-screenshots/baseline/login/mobile-375.png`
- `.responsive-screenshots/baseline/dashboard/mobile-375.png`
- `.responsive-screenshots/baseline/preventivi/mobile-375.png`
- `.responsive-screenshots/baseline/clienti/mobile-375.png`

Annotare in memoria (non nel plan) quali dashboard pages secondarie hanno problemi reali — determina se le Fasi 4.b-4.e sono necessarie.

---

## Fase 1 — QuoteEditor (priorità massima)

### Task 1.1: QuoteEditor container principale

**Files:**
- Modify: `src/components/quote/QuoteEditor.tsx`

**Obiettivo:** Split 40/60 deve diventare stacking verticale su mobile/tablet. Il pannello preview resta `hidden lg:flex`, il MobilePreview overlay già esiste — verificare che funzioni.

- [ ] **Step 1: Leggere QuoteEditor.tsx integralmente**

Se troppo grande, leggere in chunk: lines 1-300, poi 300-end. Annotare ogni classe con dimensioni fisse (`w-[40%]`, `w-[60%]`, `h-[calc(...)]`, padding fissi grandi).

- [ ] **Step 2: Verificare il container root già ha `flex-col lg:flex-row`**

Cercare il wrapper principale. Dovrebbe contenere qualcosa tipo:

```tsx
<div className="flex flex-col lg:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-76px)]">
```

Se **già presente**, confermare che i figli usano `w-full lg:w-[40%]` e `hidden lg:flex w-[60%]`. Passare allo step 4.

Se **non presente**, applicare il pattern P1 dello spec:

```diff
- <div className="flex h-full">
+ <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-76px)]">
```

E sui due pannelli figli:

```diff
-  <div className="w-[40%] ...">
+  <div className="w-full lg:w-[40%] ...">
```

```diff
-  <div className="flex w-[60%] ...">
+  <div className="hidden lg:flex w-[60%] ...">
```

- [ ] **Step 3: Altezza del pannello editor su mobile**

Su mobile il pannello editor occupa tutta la viewport. Verificare che il contenitore dei tab (DATI/VOCI/RIEPILOGO) abbia scroll interno, non sforando la viewport. Se il pannello tabs wrappa tutto in `overflow-hidden` senza `overflow-y-auto`, aggiungerlo:

```diff
- <div className="flex-1 overflow-hidden">
+ <div className="flex-1 overflow-y-auto">
```

Solo se la lettura del file conferma che serve. Non aggiungere in blind.

- [ ] **Step 4: Smoke test manuale dev server**

Con `npm run dev` attivo, aprire Chrome DevTools in mobile mode (iPhone SE 375px), navigare a `/nuovo` (dopo login manuale). Verificare:
- Niente scroll orizzontale del body
- Il pannello editor è full-width
- Il MobilePreview toggle button (`lg:hidden fixed bottom-...`) è visibile

- [ ] **Step 5: Commit parziale**

```bash
git add src/components/quote/QuoteEditor.tsx
git commit -m "fix: QuoteEditor responsive main container stacking"
```

---

### Task 1.2: QuoteEditor Tab DATI — SenderForm + ClientForm

**Files:**
- Modify: `src/components/quote/SenderForm.tsx` (se esiste)
- Modify: `src/components/quote/ClientForm.tsx` (se esiste)

- [ ] **Step 1: Trovare i file**

```
Glob: src/components/quote/*Form*.tsx
```

Leggere entrambi integralmente.

- [ ] **Step 2: Identificare grid a colonne fisse**

Cercare pattern come `grid-cols-2`, `grid-cols-3` (dati azienda: nome, P.IVA, indirizzo, CAP, città...). Questi devono diventare single-column su mobile.

Applicare pattern P2:

```diff
- <div className="grid grid-cols-2 gap-4">
+ <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

Per grid di 3+ colonne:

```diff
- <div className="grid grid-cols-3 gap-4">
+ <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

- [ ] **Step 3: Font-size dei label e padding dei card**

Se i form sono dentro card con `p-8` o simili, ridurli su mobile (P3):

```diff
- <div className="p-8 rounded-2xl ...">
+ <div className="p-4 sm:p-6 md:p-8 rounded-2xl ...">
```

Solo se il file ha effettivamente `p-8` su card contenenti form.

- [ ] **Step 4: Touch target input**

Gli input devono essere almeno `h-11` (44px). Se nei file gli input hanno `h-10` o `h-9`, alzarli a `h-11` su mobile:

```diff
- className="h-10 ..."
+ className="h-11 md:h-10 ..."
```

Solo se i valori attuali sono < 44px.

- [ ] **Step 5: Screenshot di verifica**

```bash
TEST_EMAIL=fe.developer22@gmail.com TEST_PASSWORD=Test1234! npx tsx scripts/responsive-check.ts after-quote-dati /nuovo
```

Confrontare `.responsive-screenshots/after-quote-dati/nuovo/mobile-375.png` con la baseline. Il tab DATI deve essere visibile e usabile.

- [ ] **Step 6: Commit**

```bash
git add src/components/quote/SenderForm.tsx src/components/quote/ClientForm.tsx
git commit -m "fix: responsive SenderForm and ClientForm on mobile"
```

---

### Task 1.3: QuoteEditor Tab VOCI — LineItemsTable

**Files:**
- Modify: `src/components/quote/LineItemsTable.tsx` (o file equivalente)

**Obiettivo:** Una tabella con colonne Descrizione/Qtà/Prezzo/IVA/Totale non sta in 375px. Si risolve con uno dei due fallback dal pattern P5.

- [ ] **Step 1: Trovare e leggere il file**

```
Glob: src/components/quote/*LineItem*.tsx
```

Leggere e identificare:
- È un `<table>` HTML semantico, oppure è un insieme di `<div className="grid grid-cols-X">`?
- Quante colonne?
- C'è uno state management per le righe (React state, Zustand)?

- [ ] **Step 2: Decidere la strategia**

**Opzione A (preferita se il contenuto è semplice):** `overflow-x-auto` sul wrapper della tabella.

```diff
- <div className="..."> <!-- wrapper attuale -->
-   <table>...</table>
+ <div className="...">
+   <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
+     <table className="min-w-[640px] lg:min-w-0">...</table>
+   </div>
```

Questo lascia la tabella scorrere orizzontalmente su mobile senza cambiare markup.

**Opzione B (card stack, più UX-friendly):** Rendere la tabella `hidden lg:table` e aggiungere una versione card `lg:hidden`.

Scegliere A se la tabella è complessa o usa molte celle con event handler. B se il numero di righe è basso e i dati sono semplici.

- [ ] **Step 3: Applicare l'opzione scelta**

Se si sceglie A, applicare solo le modifiche dello Step 2 opzione A.

Se si sceglie B, il markup card va costruito replicando gli stessi handler/state dell'originale. Struttura tipo:

```tsx
{/* Mobile card view */}
<div className="lg:hidden space-y-3">
  {items.map((item, idx) => (
    <div key={item.id} className="bg-white border rounded-xl p-4 space-y-3">
      <input
        value={item.description}
        onChange={(e) => updateItem(idx, 'description', e.target.value)}
        placeholder="Descrizione"
        className="w-full h-11 px-3 border rounded-lg"
      />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={item.quantity} onChange={...} placeholder="Qtà" className="h-11 ..." />
        <input type="number" value={item.unitPrice} onChange={...} placeholder="€ unitario" className="h-11 ..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={item.vat} onChange={...} placeholder="IVA %" className="h-11 ..." />
        <div className="h-11 flex items-center justify-end font-bold">
          {formatCurrency(item.total)}
        </div>
      </div>
      <button onClick={() => removeItem(idx)} className="text-rose-500 text-sm font-bold">
        Rimuovi riga
      </button>
    </div>
  ))}
</div>

{/* Desktop table view */}
<table className="hidden lg:table ...">
  ...original table...
</table>
```

I nomi esatti di `updateItem`, `removeItem`, campi dell'item devono essere copiati 1:1 dall'originale leggendo il file nello Step 1.

- [ ] **Step 4: Bottone "Aggiungi riga" touch-friendly**

Se esiste un bottone "Aggiungi voce", confermare `h-11` o più:

```diff
- <button className="h-9 ...">Aggiungi voce</button>
+ <button className="h-11 md:h-10 ...">Aggiungi voce</button>
```

- [ ] **Step 5: Screenshot di verifica**

```bash
TEST_EMAIL=fe.developer22@gmail.com TEST_PASSWORD=Test1234! npx tsx scripts/responsive-check.ts after-quote-voci /nuovo
```

Aprire `.responsive-screenshots/after-quote-voci/nuovo/mobile-375.png`, navigare mentalmente al tab VOCI (lo screenshot è della tab attiva al load — se serve aggiungere una riga specifica per vedere la tabella, farlo manualmente in DevTools).

- [ ] **Step 6: Commit**

```bash
git add src/components/quote/LineItemsTable.tsx
git commit -m "fix: responsive LineItemsTable on mobile"
```

---

### Task 1.4: QuoteEditor Tab RIEPILOGO + AI Magic Banner + action buttons

**Files:**
- Modify: `src/components/quote/QuoteEditor.tsx` (sezione riepilogo, banner, bottoni)

- [ ] **Step 1: Rileggere le sezioni**

Nella lettura di Task 1.1, trovare le sezioni:
- AI Magic Banner (ha già `p-5 md:p-10`, `text-lg md:text-3xl` secondo lo spec baseline)
- Grid action buttons (`grid-cols-1 md:grid-cols-2 gap-4` per Download/Save)
- Area totali riepilogo

- [ ] **Step 2: AI Magic Banner — verifica padding e testo**

Se è già `p-5 md:p-10`, va bene. Verificare solo:
- Nessun testo taglia fuori dallo schermo a 375px
- Il bottone CTA del banner (se c'è) è `h-11` o più

- [ ] **Step 3: Action buttons Download/Save**

Il pattern attuale `grid-cols-1 md:grid-cols-2` è già mobile-friendly. Verificare che ogni bottone sia `h-12` o almeno `h-11`. Se è `h-9`/`h-10`, alzare:

```diff
- <button className="h-10 ...">
+ <button className="h-12 ...">
```

- [ ] **Step 4: Sezione totali**

Se c'è una griglia totali (Imponibile / IVA / Totale) con `grid-cols-3`, considerare se sta su 375px. Di solito sì perché sono solo numeri. Se no, applicare P2.

- [ ] **Step 5: Commit**

```bash
git add src/components/quote/QuoteEditor.tsx
git commit -m "fix: responsive QuoteEditor summary tab and action buttons"
```

---

### Task 1.5: QuoteEditor MobilePreview overlay e toggle

**Files:**
- Modify: `src/components/quote/QuoteEditor.tsx` (sezione MobilePreview)
- Modify: `src/components/quote/QuotePreview.tsx` (solo se necessario)

- [ ] **Step 1: Rileggere la sezione MobilePreview**

Cercare nel file `lg:hidden fixed bottom-` per il toggle button e `lg:hidden fixed inset-0 z-50` per l'overlay full-screen.

- [ ] **Step 2: Toggle button — safe-area + touch target**

Verificare che il bottone toggle abbia:
- `bottom-4` (non bottom-2 che sarebbe troppo vicino al bordo)
- `h-12 w-12` minimo (o più grande)
- `pb-[env(safe-area-inset-bottom)]` sul contenitore se necessario per iPhone con notch inferiore

Fix se mancante:

```diff
- <button className="lg:hidden fixed bottom-6 left-4 z-30 w-10 h-10 ...">
+ <button className="lg:hidden fixed bottom-4 left-4 z-30 w-12 h-12 ..." style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
```

- [ ] **Step 3: Overlay content — scroll interno**

L'overlay preview deve avere scroll interno su mobile (il PDF preview può essere più alto di 812px). Se manca `overflow-y-auto` sul contenitore dell'overlay, aggiungerlo:

```diff
- <div className="lg:hidden fixed inset-0 z-50 bg-background">
+ <div className="lg:hidden fixed inset-0 z-50 bg-background overflow-y-auto">
```

- [ ] **Step 4: Bottone chiusura overlay**

Ci deve essere un bottone X per chiudere l'overlay. Verificare che sia:
- `fixed` o `sticky` dentro l'overlay (sempre visibile mentre si scrolla)
- `h-11 w-11` minimo
- Posizionato dove non copre contenuto critico del preview

- [ ] **Step 5: Screenshot di verifica**

```bash
TEST_EMAIL=fe.developer22@gmail.com TEST_PASSWORD=Test1234! npx tsx scripts/responsive-check.ts after-quote-preview /nuovo
```

- [ ] **Step 6: Commit**

```bash
git add src/components/quote/QuoteEditor.tsx src/components/quote/QuotePreview.tsx
git commit -m "fix: responsive QuoteEditor mobile preview overlay"
```

---

### Task 1.6: QuoteEditor lock overlays + AIAssistant + AttachmentsManager

**Files:**
- Modify: `src/components/quote/QuoteEditor.tsx` (sezione overlays `isLocked`, `noCreditsEdit`)
- Modify: `src/components/quote/AIAssistant.tsx` (se esiste)
- Modify: `src/components/quote/AttachmentsManager.tsx` (se esiste)

- [ ] **Step 1: Lock overlays**

Nel file principale ci sono overlay posizionati a `lg:w-[40%]` per isLocked/noCreditsEdit. Su mobile devono coprire l'intera larghezza:

```diff
- <div className="absolute inset-0 lg:w-[40%] ...">
+ <div className="absolute inset-0 w-full lg:w-[40%] ...">
```

Cercare tutte le occorrenze. Verificare che il contenuto centrato dell'overlay (icona + titolo + CTA) non sfori a 375px: padding `p-4 md:p-8`, font `text-xl md:text-3xl`.

- [ ] **Step 2: AIAssistant**

Se esiste e viene renderizzato nel tab dati (o ovunque), leggere e applicare pattern:
- Modal/drawer fullwidth su mobile (`w-full max-w-lg`)
- Padding ridotto `p-4 sm:p-6`
- Bottoni `h-11`

- [ ] **Step 3: AttachmentsManager**

Se esiste, leggere. Tipicamente è una lista di file con upload button. Verificare:
- Upload button touch-friendly (`h-12`)
- Lista file non sfora (truncate nomi file: `truncate` class)

- [ ] **Step 4: Screenshot finale della Fase 1**

```bash
TEST_EMAIL=fe.developer22@gmail.com TEST_PASSWORD=Test1234! npx tsx scripts/responsive-check.ts fase1-final /nuovo
```

Confrontare con `baseline/nuovo/*` — verifica che 1440px sia identico al baseline (no regression desktop).

- [ ] **Step 5: Typecheck + lint**

```bash
npm run typecheck && npm run lint
```

Expected: zero errori.

- [ ] **Step 6: Commit Fase 1 finale**

```bash
git add src/components/quote/
git commit -m "fix: responsive QuoteEditor lock overlays and AI assistant"
```

---

## Fase 2 — Landing page

### Task 2.1: Leggere landing in chunk

**Files:** nessuna modifica. Solo exploration.

- [ ] **Step 1: Lettura in chunk**

Leggere `src/app/(marketing)/page.tsx` in 3-4 chunk da ~200 righe. Identificare le sezioni:
- Navbar
- Hero (titolo + CTA)
- Social proof / Marquee
- Feature sections (screenshots, bullet list, ecc.)
- Pricing
- Footer

Per ogni sezione annotare mentalmente i problemi visti nello screenshot baseline.

---

### Task 2.2: Navbar

**Files:**
- Modify: `src/app/(marketing)/page.tsx` (sezione Navbar)

- [ ] **Step 1: Trovare il componente Navbar**

Cercare `const Navbar` o `function Navbar` nel file.

- [ ] **Step 2: Pattern tipici da applicare**

- Hide dei link secondari su mobile (`hidden md:flex`), già presente secondo il baseline
- CTA primaria deve restare visibile su mobile ma compatta:

```diff
- <Link className="px-6 py-3 ...">Inizia Gratis</Link>
+ <Link className="px-4 py-2.5 md:px-6 md:py-3 text-sm md:text-base ...">Inizia Gratis</Link>
```

- Logo dimensione responsive:

```diff
- <Image src="/logo.png" width={180} height={40} />
+ <Image src="/logo.png" width={180} height={40} className="w-[120px] md:w-[180px] h-auto" />
```

- Container: padding ridotto su mobile

```diff
- <nav className="max-w-6xl mx-auto px-6 h-16 ...">
+ <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 ...">
```

- [ ] **Step 3: Commit parziale**

```bash
git add src/app/\(marketing\)/page.tsx
git commit -m "fix: responsive landing navbar"
```

---

### Task 2.3: Hero + Social Proof

**Files:**
- Modify: `src/app/(marketing)/page.tsx` (sezione Hero)

- [ ] **Step 1: Hero title font-size**

Applicare P4:

```diff
- <h1 className="text-7xl font-black ...">
+ <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black ...">
```

- [ ] **Step 2: Hero subtitle**

```diff
- <p className="text-2xl ...">
+ <p className="text-lg sm:text-xl md:text-2xl ...">
```

- [ ] **Step 3: Hero CTA buttons**

Stacking verticale su mobile:

```diff
- <div className="flex gap-4">
+ <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
```

E ogni bottone `w-full sm:w-auto`:

```diff
- <Link className="px-8 py-4 ...">
+ <Link className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 text-center ...">
```

- [ ] **Step 4: Hero padding section**

```diff
- <section className="pt-32 pb-24 px-6">
+ <section className="pt-20 pb-12 px-4 sm:pt-24 sm:pb-16 md:pt-32 md:pb-24 sm:px-6">
```

- [ ] **Step 5: Marquee / social proof**

Se usa un componente `<Marquee>` che ripete loghi, verificare che:
- Non sfori orizzontalmente (dovrebbe già essere gestito dal componente)
- I loghi abbiano dimensione ridotta su mobile

- [ ] **Step 6: Commit**

```bash
git add src/app/\(marketing\)/page.tsx
git commit -m "fix: responsive landing hero section"
```

---

### Task 2.4: Feature sections

**Files:**
- Modify: `src/app/(marketing)/page.tsx` (sezioni features)

- [ ] **Step 1: Per ogni feature section con layout 2 colonne (testo + screenshot)**

Applicare P1:

```diff
- <div className="grid grid-cols-2 gap-12 items-center">
+ <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
```

Se alternano `order` (feature con screenshot a sinistra vs destra), lasciare su mobile l'ordine naturale testo-poi-immagine.

- [ ] **Step 2: Titoli di sezione**

```diff
- <h2 className="text-5xl ...">
+ <h2 className="text-3xl sm:text-4xl md:text-5xl ...">
```

- [ ] **Step 3: Card feature (se ci sono grid di card)**

```diff
- <div className="grid grid-cols-3 gap-6">
+ <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

- [ ] **Step 4: Padding section**

```diff
- <section className="py-24 px-6">
+ <section className="py-16 px-4 sm:py-20 sm:px-6 md:py-24">
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(marketing\)/page.tsx
git commit -m "fix: responsive landing feature sections"
```

---

### Task 2.5: Pricing + Footer + verifica finale

**Files:**
- Modify: `src/app/(marketing)/page.tsx` (sezioni pricing e footer)

- [ ] **Step 1: Pricing cards**

Se ci sono 3 card piano affiancate:

```diff
- <div className="grid grid-cols-3 gap-8">
+ <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
```

Le card devono mantenere il loro stile attuale (non modificare radius, colori, shadow). Solo padding interno ridotto:

```diff
- <div className="p-10 rounded-3xl bg-white ...">
+ <div className="p-6 sm:p-8 md:p-10 rounded-3xl bg-white ...">
```

Featured card ("Consigliato"): verificare che il badge non sfori.

- [ ] **Step 2: Footer**

Se il footer ha 4 colonne affiancate:

```diff
- <footer className="grid grid-cols-4 gap-8 ...">
+ <footer className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 ...">
```

Logo e copyright dovrebbero stare su una riga:

```diff
- <div className="flex justify-between items-center ...">
+ <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center ...">
```

- [ ] **Step 3: Screenshot verifica Fase 2**

```bash
npx tsx scripts/responsive-check.ts fase2-final /
```

Confrontare con baseline. Verificare desktop 1440 identico.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(marketing\)/page.tsx
git commit -m "fix: responsive landing pricing and footer"
```

---

## Fase 3 — Login + Register

### Task 3.1: Login page

**Files:**
- Modify: `src/app/(marketing)/login/page.tsx`

**Nota di sicurezza:** Questa pagina contiene `signInWithPassword` e `signInWithOAuth`. **Non toccare la logica** di queste chiamate né i loro parametri. Solo JSX/className.

- [ ] **Step 1: Rileggere il file**

Identificare la struttura: card centrata `max-w-[440px] p-6` — già mobile-friendly.

- [ ] **Step 2: Verificare padding container**

Il root `min-h-screen ... p-6` potrebbe essere troppo stretto a 375px (p-6 = 24px × 2 = 48px, lascia 327px utili, accettabile). Se serve:

```diff
- <div className="min-h-screen ... p-6">
+ <div className="min-h-screen ... p-4 sm:p-6">
```

- [ ] **Step 3: Card interna**

Cercare `p-8` sulla card:

```diff
- <div className="bg-[#111118]/60 ... p-8 ...">
+ <div className="bg-[#111118]/60 ... p-6 sm:p-8 ...">
```

- [ ] **Step 4: Font-size titolo**

```diff
- <h1 className="text-3xl ...">Bentornato</h1>
+ <h1 className="text-2xl sm:text-3xl ...">Bentornato</h1>
```

- [ ] **Step 5: Input e bottoni ≥ 44px**

Verificare che input abbiano `h-12` e bottoni `h-12`. Se il file usa `h-12`, è già ok.

- [ ] **Step 6: Screenshot verifica**

```bash
npx tsx scripts/responsive-check.ts fase3-login /login
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(marketing\)/login/page.tsx
git commit -m "fix: responsive login page"
```

---

### Task 3.2: Register page

**Files:**
- Modify: `src/app/(marketing)/register/page.tsx`

**Nota di sicurezza:** Contiene `signUp`. Stesse regole di login: solo JSX/className.

- [ ] **Step 1: Rileggere**

Struttura identica a login. Password validation UI rimane invariata (solo client-side UX, non è security).

- [ ] **Step 2: Applicare gli stessi fix di login (Step 2-5 di Task 3.1)**

Container padding, card padding, titolo font-size, input/bottoni.

- [ ] **Step 3: Success state (check email)**

La pagina ha uno stato `success` con un card "Controlla la tua email". Verificare:
- Testo non sfora a 375px (font-size, word-break)
- Bottoni "Reinvia" e "Torna al login" sono `h-11` o più
- L'email mostrata (`<strong>{email}</strong>`) usa `break-all` se è lunga:

```diff
- <strong className="text-white font-bold">{email}</strong>
+ <strong className="text-white font-bold break-all">{email}</strong>
```

- [ ] **Step 4: Screenshot**

```bash
npx tsx scripts/responsive-check.ts fase3-register /register
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(marketing\)/register/page.tsx
git commit -m "fix: responsive register page"
```

---

## Fase 4 — Dashboard pages

### Task 4.1: Dashboard home

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Rileggere**

Il file è 413 righe. Leggerlo interamente.

- [ ] **Step 2: Welcome banner**

Se esiste un banner "Benvenuto {nome}" con layout `flex`:

```diff
- <div className="flex items-center justify-between ...">
+ <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ...">
```

Il CTA del banner full-width su mobile:

```diff
- <Link className="px-6 py-3 ...">
+ <Link className="w-full md:w-auto px-6 py-3 text-center ...">
```

- [ ] **Step 3: KPI grid**

Attuale: `grid-cols-2 lg:grid-cols-3`. Già mobile-friendly (2 card a schermo piccolo). Verificare che le card non sforino orizzontalmente — se il contenuto è lungo (numeri + label), ridurre padding:

```diff
- <div className="p-6 ...">
+ <div className="p-4 sm:p-6 ...">
```

- [ ] **Step 4: Quick actions grid**

Attuale: `grid-cols-2 md:grid-cols-4`. Ok. Verificare padding interno.

- [ ] **Step 5: Main grid (2/3 + 1/3 split)**

Attuale: `grid-cols-1 lg:grid-cols-3`. Ok su mobile (stacking). Su tablet 768px rimane 1 colonna — valutare se a `md:grid-cols-3` è meglio, ma di solito 768 è ancora stretto per 2/3+1/3, quindi lasciare `lg:grid-cols-3`.

- [ ] **Step 6: Container padding**

```diff
- <div className="p-6 md:p-8 max-w-7xl mx-auto">
+ <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
```

- [ ] **Step 7: Screenshot**

```bash
npx tsx scripts/responsive-check.ts fase4-dashboard /dashboard
```

- [ ] **Step 8: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "fix: responsive dashboard home page"
```

---

### Task 4.2: DashboardHeader

**Files:**
- Modify: `src/components/layout/DashboardHeader.tsx`

- [ ] **Step 1: Rileggere**

File già letto, struttura: header `h-[60px] md:h-[80px]`, user dropdown, NotificationBell.

- [ ] **Step 2: User profile display su mobile**

Attuale: il nome ha `hidden sm:flex` — quindi su < 640px mostra solo avatar. Ok.

Verificare che il dropdown menu non sforiorizzontalmente: attuale `w-60 md:w-64`. Ok.

- [ ] **Step 3: Dropdown menu — max-height su mobile**

Se l'header è a 60px e il dropdown si apre verso il basso, su mobile deve entrare nella viewport:

```diff
- className="absolute right-0 mt-3 w-60 md:w-64 ..."
+ className="absolute right-0 mt-3 w-60 md:w-64 max-h-[calc(100vh-80px)] overflow-y-auto ..."
```

- [ ] **Step 4: Page title truncate**

Attuale: `text-lg md:text-2xl ... truncate`. Il `truncate` già gestisce testi lunghi. Ok.

- [ ] **Step 5: Commit (se ci sono modifiche)**

```bash
git add src/components/layout/DashboardHeader.tsx
git commit -m "fix: responsive dashboard header dropdown"
```

Se nessuna modifica è necessaria (dopo review screenshot), saltare il commit.

---

### Task 4.3: Altre dashboard pages (conditional)

**Files:**
- Modify: `src/app/(dashboard)/preventivi/page.tsx` (se rotto)
- Modify: `src/app/(dashboard)/preventivi/archivio/page.tsx` (se rotto)
- Modify: `src/app/(dashboard)/clienti/page.tsx` (se rotto)
- Modify: `src/app/(dashboard)/impostazioni/page.tsx` (se rotto)

- [ ] **Step 1: Per ogni pagina — screenshot baseline review**

Aprire `.responsive-screenshots/baseline/<page>/mobile-375.png`. Se la pagina si vede bene, **saltare** la pagina.

- [ ] **Step 2: Per ogni pagina rotta — leggere il file**

- [ ] **Step 3: Applicare i pattern P1-P9 dallo spec**

Concentrarsi su:
- **Liste/tabelle**: stesso trattamento di LineItemsTable (P5 → overflow-x-auto o card stack)
- **Form (impostazioni)**: stesso di SenderForm/ClientForm (P2 grid degradante)
- **Container padding**: P3 `p-4 sm:p-6 md:p-8`
- **Filter bar e action button in alto**: stacking verticale su mobile (`flex-col sm:flex-row`)

- [ ] **Step 4: Per ogni pagina modificata — screenshot**

```bash
npx tsx scripts/responsive-check.ts fase4-<page-name> /<page-path>
```

- [ ] **Step 5: Commit per pagina**

```bash
git add src/app/\(dashboard\)/<page>/page.tsx
git commit -m "fix: responsive <page> on mobile"
```

---

## Fase 5 — Verifica finale + cleanup

### Task 5.1: Screenshot finale completo

**Files:** nessuna modifica. Solo esecuzione.

- [ ] **Step 1: Run completo dello script**

```bash
TEST_EMAIL=fe.developer22@gmail.com TEST_PASSWORD=Test1234! npx tsx scripts/responsive-check.ts final
```

- [ ] **Step 2: Confronto desktop 1440 baseline vs final**

Per ogni route, aprire:
- `.responsive-screenshots/baseline/<route>/desktop-1440.png`
- `.responsive-screenshots/final/<route>/desktop-1440.png`

**Regola**: devono essere praticamente identici (font rendering può differire leggermente). Qualsiasi differenza strutturale è un bug di regressione desktop → fixare nel file coinvolto.

- [ ] **Step 3: Review mobile-375 finale**

Aprire tutti gli `mobile-375.png` finali. Verificare criteri "done":
1. Nessun overflow orizzontale (la viewport dovrebbe terminare esattamente al bordo del contenuto)
2. Nessun testo tagliato
3. Tutti i bottoni visibili e dimensionati

- [ ] **Step 4: Typecheck + lint + test**

```bash
npm run typecheck && npm run lint && npm run test
```

Expected: tutto passa. Se fallisce, fix e re-run.

---

### Task 5.2: Cleanup Playwright throwaway

**Files:**
- Delete: `scripts/responsive-check.ts`
- Delete: `scripts/README-responsive.md`
- Modify: `package.json` (rimuovere `@playwright/test`, eventualmente `tsx` se non serve altrove)
- Modify: `.gitignore` (rimuovere la riga `.responsive-screenshots/`)
- Delete: `.responsive-screenshots/` directory

- [ ] **Step 1: Rimuovere script**

```bash
rm scripts/responsive-check.ts scripts/README-responsive.md
rm -rf .responsive-screenshots/
rmdir scripts 2>/dev/null || true  # solo se vuota
```

- [ ] **Step 2: Disinstallare Playwright**

```bash
npm uninstall @playwright/test
```

Se `tsx` era già presente come dev dep per altro, NON rimuoverlo. Se è stato aggiunto solo per questo script, rimuoverlo:

```bash
npm ls tsx
# se mostra solo come devDependency root:
npm uninstall tsx
```

- [ ] **Step 3: Rimuovere `.responsive-screenshots/` da `.gitignore`**

Aprire `.gitignore` e rimuovere:

```
# responsive check screenshots (throwaway)
/.responsive-screenshots/
```

- [ ] **Step 4: Verifica che nulla si sia rotto**

```bash
npm run typecheck && npm run build
```

Expected: build pulita.

- [ ] **Step 5: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove throwaway Playwright responsive check script"
```

---

### Task 5.3: Commit di chiusura lavoro

- [ ] **Step 1: Git log review**

```bash
git log --oneline main..HEAD
```

Expected: una sequenza ordinata di commit `fix: responsive ...` + `chore: add/remove ... Playwright ...` + `docs: add responsive mobile design spec`.

- [ ] **Step 2: Non fare merge/push**

Non spingere a remote senza autorizzazione esplicita dell'utente. Attendere istruzioni su `git push` o apertura PR.

---

## Checklist di copertura (self-review del plan)

- ✅ QuoteEditor container stacking (Task 1.1)
- ✅ QuoteEditor tab DATI forms (Task 1.2)
- ✅ QuoteEditor tab VOCI tabella (Task 1.3)
- ✅ QuoteEditor tab RIEPILOGO + action buttons (Task 1.4)
- ✅ QuoteEditor MobilePreview overlay (Task 1.5)
- ✅ QuoteEditor lock overlays + AI + attachments (Task 1.6)
- ✅ Landing navbar (Task 2.2)
- ✅ Landing hero (Task 2.3)
- ✅ Landing feature sections (Task 2.4)
- ✅ Landing pricing + footer (Task 2.5)
- ✅ Login page (Task 3.1)
- ✅ Register page (Task 3.2)
- ✅ Dashboard home (Task 4.1)
- ✅ DashboardHeader (Task 4.2)
- ✅ Altre dashboard pages conditional (Task 4.3)
- ✅ Verifica finale + cleanup (Fase 5)
- ✅ Nessun file in "out of scope" modificato
- ✅ Pattern dallo spec P1-P9 referenziati
- ✅ Playwright installato e rimosso esplicitamente
- ✅ Credenziali test passate come env var (non hardcoded)
