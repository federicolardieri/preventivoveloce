# Responsive Mobile Design — Design Spec

**Data**: 2026-04-11
**Autore**: brainstorming session (Federico + Claude)
**Tipo**: fix cross-cutting UI (niente cambi di business logic, auth, schema)

## Obiettivo

Rendere responsive per mobile (≤ 1024px) le pagine principali dell'app **Preventivo Veloce**, senza modificare layout né stile del sito su desktop e senza toccare nulla che possa impattare la sicurezza.

Priorità assoluta: la pagina **nuovo preventivo** ([QuoteEditor.tsx](../../../src/components/quote/QuoteEditor.tsx)) deve essere perfetta su telefono.

## Scope

### In scope
- [src/components/quote/QuoteEditor.tsx](../../../src/components/quote/QuoteEditor.tsx) (critico, primo file lavorato)
- [src/app/(marketing)/page.tsx](../../../src/app/(marketing)/page.tsx) — landing page, full pass
- [src/app/(marketing)/login/page.tsx](../../../src/app/(marketing)/login/page.tsx)
- [src/app/(marketing)/register/page.tsx](../../../src/app/(marketing)/register/page.tsx)
- [src/app/(dashboard)/dashboard/page.tsx](../../../src/app/(dashboard)/dashboard/page.tsx)
- Altre pagine `(dashboard)/*` (preventivi, archivio, clienti, impostazioni) — solo se screenshot baseline mostra problemi
- Sub-componenti di layout/quote usati dalle pagine sopra, se necessario

### Out of scope (guardrail sicurezza)
- **NON si tocca MAI**:
  - [src/middleware.ts](../../../src/middleware.ts) e [src/lib/supabase/](../../../src/lib/supabase/)
  - API routes in `src/app/api/`
  - Server Actions, Server Components data-fetching
  - Migration SQL, RLS policy, Supabase config
  - Auth flow: UI sì, logica auth (`signUp`, `signInWithPassword`, `signInWithOAuth` e i loro parametri) no
  - Validazioni input, tipi TypeScript dei dati
  - Variabili d'ambiente, secrets
  - `.env*`, `next.config.js`, `tsconfig.json`, `tailwind.config.js` (niente nuovi breakpoint)

### Vincolo desktop
Il rendering attuale a ≥ 1024px deve restare **identico**. Classi sempre aggiunte mobile-first (`flex-col lg:flex-row`, `text-3xl lg:text-6xl`), mai al contrario.

## Approccio

**Approccio A — Surgical fix per file, QuoteEditor-first.**

Niente astrazioni condivise, niente refactor, niente nuovi helper/utility. Ogni fix è un diff piccolo e review-friendly di classi Tailwind e minimi rework di markup JSX, un file alla volta.

Alternative scartate:
- **B — Utility condivisi**: viola "preferire soluzioni semplici ad astrazioni premature" (CLAUDE.md). Troppo rischio di toccare cose non necessarie.
- **C — Solo QuoteEditor**: lascia il resto rotto. Meglio procedere a cascata dopo QuoteEditor.

## Ordine di lavoro

### Fase 0 — Setup Playwright
Script throwaway `scripts/responsive-check.ts`:
- 3 viewport: `375×812`, `768×1024`, `1440×900`
- Login automatico (per dashboard pages) con credenziali test fornite dall'utente
- Screenshot full-page salvati in `.responsive-screenshots/` (git-ignored)
- Eliminato a fine lavoro

### Fase 1 — QuoteEditor
1. Baseline screenshot `/nuovo` a 375/768/1440
2. Fix container principale (split `lg:flex-row`, altezze, scroll)
3. Fix tab DATI/VOCI/RIEPILOGO e loro contenuto
4. Fix sub-componenti: SenderForm, ClientForm, LineItemsTable (probabile rework tabella → card stack o overflow-x)
5. Fix MobilePreview overlay + toggle button
6. Fix action button (Download/Save) + AI Magic Banner
7. Verifica finale: screenshot Playwright + confronto desktop 1440
8. Commit: `fix: responsive QuoteEditor on mobile`

### Fase 2 — Landing page
1. Screenshot baseline `/`
2. Lettura [page.tsx](../../../src/app/(marketing)/page.tsx) in chunk (~625 righe)
3. Fix per sezione: Navbar → Hero → feature sections → footer
4. Commit: `fix: responsive landing page on mobile`

### Fase 3 — Login + Register
1. Screenshot baseline `/login` e `/register`
2. Fix minori attesi (padding, font-size)
3. Commit: `fix: responsive login and register pages`

### Fase 4 — Dashboard pages
1. Screenshot baseline `/dashboard`, fix
2. Pass veloce su `/preventivi`, `/preventivi/archivio`, `/clienti`, `/impostazioni`: fix solo dove rotto
3. Fix minore atteso su [DashboardHeader.tsx](../../../src/components/layout/DashboardHeader.tsx)
4. Commit: `fix: responsive dashboard pages`

## Pattern di fix tipici

| ID | Nome | Uso |
|----|------|-----|
| P1 | Stacking colonne | `flex-col lg:flex-row` + `w-full lg:w-[40%]` |
| P2 | Grid degradanti | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| P3 | Padding responsive | `p-4 sm:p-6 md:p-8 lg:p-12` |
| P4 | Font-size responsive | `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` |
| P5 | Tabelle → card/scroll | `overflow-x-auto` oppure `lg:hidden` + `<div>` card mobile |
| P6 | Overflow guard | `min-w-0 overflow-x-hidden` su flex children |
| P7 | Elementi hidden per bp | `hidden sm:inline` / `sm:hidden` |
| P8 | Fixed position safe area | verificare a 375px, `pb-[env(safe-area-inset-bottom)]` se serve |
| P9 | Touch target ≥ 44px | `h-11` min su bottoni/icon-button |

## Anti-pattern (vietati)

- `!important` o hack di specificità
- Cambi al design system (colori, radius, tipografia)
- Nuovi breakpoint custom in `tailwind.config.js`
- Modifiche ai componenti `ui/` shadcn se non strettamente necessarie
- Rimozione di animazioni framer-motion (al massimo semplificate se causano layout shift mobile)

## Verifica e criterio "done"

Per ogni pagina lavorata:
1. **Nessun overflow orizzontale** a 375px (body `scroll-x = 0`)
2. **Nessun testo tagliato** o coperto da elementi fissi
3. **Touch target** ≥ 44px per tutti i CTA/bottoni tappabili
4. **Screenshot 1440 identico** al pre-fix (pixel-diff tollerante a font rendering)
5. **Smoke test manuale desktop 1440**: click sugli elementi modificati per conferma

## Rischi e mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Breakage layout desktop | Mobile-first: nuove classi sempre aggiunte a breakpoint < lg. Screenshot 1440 prima/dopo. |
| Tocchi accidentali a auth/middleware | Lista "out of scope" esplicita. Commit piccoli e review per file. |
| `LineItemsTable` irrisolvibile con classi | Fallback sicuro: `overflow-x-auto` sul wrapper. |
| Elementi `fixed` coprono CTA mobile | Verifica esplicita a 375px per ogni elemento `fixed` modificato. |
| Script Playwright committato per errore | `.responsive-screenshots/` in `.gitignore`; script in `scripts/` eliminato a fine lavoro. |

## Deliverable

- Commit separati per fase (QuoteEditor, landing, login/register, dashboard)
- Nessuna nuova dipendenza
- Nessuna modifica a file di sicurezza elencati in "Out of scope"
- Screenshot prima/dopo mostrati all'utente per ogni fase come prova della correzione
