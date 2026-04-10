# Preventivo Veloce

SaaS per creare, inviare e gestire preventivi professionali con PDF personalizzabili, firma digitale del cliente e tracking dello stato.

**Stack**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase + Stripe + Resend + Sentry

## Setup locale

```bash
git clone <repo-url> && cd Preventivo-veloce
cp .env.example .env.local   # poi inserisci i valori reali (vedi sotto)
npm install
npm run dev                   # http://localhost:3000
```

## Variabili d'ambiente

| Variabile | Lato | Dove trovarla |
|-----------|------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | client | Supabase Dashboard > Settings > API (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | client | Stripe Dashboard > Developers > API keys |
| `STRIPE_SECRET_KEY` | server | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | server | Stripe Dashboard > Developers > Webhooks |
| `STRIPE_STARTER_MONTHLY_PRICE_ID` | server | Stripe Dashboard > Products |
| `STRIPE_STARTER_ANNUAL_PRICE_ID` | server | Stripe Dashboard > Products |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | server | Stripe Dashboard > Products |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | server | Stripe Dashboard > Products |
| `GEMINI_API_KEY` | server | Google AI Studio |
| `RESEND_API_KEY` | server | Resend Dashboard |
| `RESEND_FROM_EMAIL` | server | Il tuo dominio verificato su Resend |
| `UPSTASH_REDIS_REST_URL` | server | Upstash Console |
| `UPSTASH_REDIS_REST_TOKEN` | server | Upstash Console |
| `ACCOUNT_DELETE_WEBHOOK_SECRET` | server | Valore custom, deve combaciare con config DB |
| `CRON_HEALTH_SECRET` | server | Genera un UUID casuale |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | entrambi | Sentry > Project Settings > Client Keys |
| `SENTRY_AUTH_TOKEN` | server | Sentry > Settings > Auth Tokens |
| `SENTRY_ORG` / `SENTRY_PROJECT` | server | Sentry > Organization > Project settings |

## Script

```bash
npm run dev        # Server di sviluppo
npm run build      # Build di produzione
npm run typecheck  # Controllo tipi TypeScript
npm run lint       # ESLint
npm run test       # Vitest (unit + integration)
```

## Struttura progetto

Vedi `CLAUDE.md` per la documentazione completa dell'architettura. In breve:

```
src/
  app/           Pagine e API routes (App Router)
  components/    Componenti React (ui/ generici, quote/ dominio)
  lib/           Utility, client Supabase, logger, rate limit
  pdf/           Template PDF (@react-pdf/renderer)
  schemas/       Validazione Zod
  store/         State management (Zustand)
  types/         Tipi TypeScript
supabase/
  migrations/    Migration SQL (mai modificare quelle gia deployate)
```

## Runbook incidenti

### Webhook Stripe non risponde
1. Controllare Sentry: filtrare per tag `area:stripe-webhook`
2. Verificare che `STRIPE_WEBHOOK_SECRET` in Vercel corrisponda a quello in Stripe Dashboard > Webhooks
3. Test locale: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Se subscription non si attiva, verificare `PLAN_BY_PRICE` in `src/app/api/stripe/webhook/route.ts` contenga i price ID corretti

### Utente non riceve email
1. Resend Dashboard > Logs: cercare il destinatario, controllare bounce/complaint
2. Se 429, il rate limit Upstash ha bloccato (max 10 email/h per utente) — aspettare
3. Verificare SPF/DKIM/DMARC nel DNS del dominio mittente
4. Per email di registrazione/reset password: controllare Supabase Dashboard > Authentication > Email Templates

### Cron downgrade non parte
1. Endpoint health: `curl -H "Authorization: Bearer $CRON_HEALTH_SECRET" https://<domain>/api/cron/health`
2. Se 500, controllare Supabase Dashboard > Database > Extensions > pg_cron
3. Riavvio manuale: `SELECT cron.schedule('downgrade-expired-plans', '5 0 * * *', 'select downgrade_expired_plans()');`
4. Verificare log: `SELECT * FROM cron.job_run_details ORDER BY end_time DESC LIMIT 5;`

### RLS blocca una query legittima
1. Verificare che la policy usi `(select auth.uid()) = user_id` (NON `auth.uid()` senza subquery)
2. Controllare che la sessione dell'utente sia valida (cookie non scaduto)
3. **Mai disabilitare RLS in produzione** — usare `service_role` solo nei contesti server sicuri
