# Preventivo Veloce — Istruzioni per Claude Code

## Panoramica del Progetto

**Preventivo Veloce** è un SaaS per la generazione e gestione di preventivi.

### Pagine principali
- **Dashboard / Crea Preventivo** — form per compilare e generare un nuovo preventivo
- **Storico Preventivi** — lista dei preventivi creati con dettaglio di ogni ordine

---

## Stack Tecnologico

- **Framework**: Next.js (App Router) con TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL gestito)
- **Autenticazione**: Supabase Auth (JWT + Row Level Security)
- **Pagamenti**: Stripe (per piani SaaS)
- **Deploy**: Vercel

---

## Comandi Principali

```bash
npm run dev        # Avvia il server di sviluppo (http://localhost:3000)
npm run build      # Build di produzione
npm run typecheck  # Controllo tipi TypeScript
npm run lint       # Linting
npm run test       # Esegui tutti i test
```

**Supabase CLI**
```bash
supabase start          # Avvia Supabase in locale (Docker)
supabase db push        # Applica le migration al database
supabase db pull        # Sincronizza schema dal database remoto
supabase gen types      # Genera i tipi TypeScript dallo schema
```

---

## Architettura

```
src/
├── app/                  # Pagine Next.js (App Router)
│   ├── dashboard/        # Dashboard e creazione preventivo
│   ├── preventivi/       # Storico preventivi
│   └── api/              # API Routes
├── components/           # Componenti React riutilizzabili
│   ├── ui/               # Componenti UI generici (button, input, modal...)
│   └── preventivo/       # Componenti specifici del dominio preventivo
├── lib/
│   ├── supabase/         # Client Supabase (browser, server, middleware)
│   └── utils/            # Utility e helpers generici
├── services/             # Business logic (separata dai componenti)
├── supabase/
│   └── migrations/       # Migration SQL (mai modificare dopo il deploy)
└── types/
    └── database.ts       # Tipi generati da `supabase gen types`
```

**Pattern chiave:**
- La business logic va nei `services/`, non nei componenti
- I componenti `ui/` sono generici e riutilizzabili
- I test co-locano con il codice sorgente (es. `foo.ts` → `foo.test.ts`)
- Le API route validano sempre l'input prima di processarlo
- Usare il client Supabase **server-side** (`@supabase/ssr`) nelle Server Actions e API route; il client browser solo nei componenti client
- Ogni tabella ha le **RLS policy** abilitate: `auth.uid() = user_id`

---

## Convenzioni di Codice

- **Moduli**: ES modules (`import/export`), mai CommonJS
- **Indentazione**: 2 spazi
- **Quote**: singole `'` per stringhe, doppie solo in JSX
- **Async**: sempre `async/await`, mai `.then()`
- **Export**: named export preferiti, default export solo per pagine Next.js
- **Tipi**: preferire `interface` per oggetti, `type` per union e alias
- **Nomi componenti**: PascalCase; funzioni e variabili: camelCase
- **Nomi file**: kebab-case per file, PascalCase per componenti React

---

## Modello Dati — Preventivo

Un preventivo contiene:
- **Intestazione**: cliente, data, numero preventivo, valuta
- **Righe**: descrizione voce, quantità, prezzo unitario, IVA
- **Totali**: imponibile, IVA, totale
- **Stato**: bozza | inviato | accettato | rifiutato | scaduto
- **Storico**: ogni modifica tracciata con timestamp e autore

---

## Regole Importanti

- **Non modificare mai** i file di migrazione già deployati
- **Await sempre** le query al database; mai fire-and-forget
- **Non loggare mai** token di autenticazione, password o dati sensibili
- **Validare sempre** l'input utente lato server (non fidarsi solo del client)
- **Idempotenza**: gli endpoint webhook devono gestire richieste duplicate
- I numeri monetari si gestiscono in **centesimi (integer)**, mai float
- Le date si salvano in **UTC**; si mostrano nel timezone dell'utente
- **RLS sempre attiva**: non disabilitarla mai in produzione; usare `service_role` solo in contesti server sicuri
- Dopo ogni modifica allo schema eseguire `supabase gen types` per aggiornare `types/database.ts`

---

## Testing

- Scrivere test per ogni nuova API route e service
- **Unit test**: Jest per services e utility
- **Integration test**: supertest per le API
- **E2E**: Playwright per i flussi critici (crea preventivo, storico)
- Mockare i servizi esterni (Stripe, email) — non chiamarli nei test
- Prima di ogni commit: `npm run test && npm run typecheck`

---

## Sicurezza

- Variabili d'ambiente in `.env.local` (mai committare in git)
- Copiare `.env.example` per il setup iniziale
- Variabili Supabase richieste: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Autenticazione richiesta su tutte le route tranne `/login` e `/register`; gestita dal middleware Next.js
- Rate limiting sulle API pubbliche
- Sanitizzare tutto l'input utente prima di renderizzarlo
- Non usare mai `SUPABASE_SERVICE_ROLE_KEY` lato client

---

## Git Workflow

- **Branch**: prefissi `feature/`, `fix/`, `refactor/`, `chore/`
- **Commit**: imperativo in inglese ("Add quote PDF export", non "Added...")
- **PR**: sempre, anche in sviluppo solo
- I test devono passare prima del merge

---

## Note per Claude

- Prima di modificare un file, leggerlo sempre per capire il contesto
- Non aggiungere feature non richieste esplicitamente
- Non aggiungere commenti al codice che non modifichi
- Preferire soluzioni semplici a astrazioni premature
- Verificare sempre con `typecheck` dopo refactoring
