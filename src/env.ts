import { z } from "zod";

/**
 * Validazione variabili d'ambiente al startup.
 *
 * ─ Server-only vars: obbligatorie in produzione, opzionali solo in dev
 *   (l'app crasha subito se mancano in prod, evitando errori criptici a runtime)
 * ─ Client vars: obbligatorie sempre (servono per inizializzare Supabase)
 */

const isServer = typeof window === "undefined";

// Schema public/client — servono sempre
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1),
});

// Schema server-only — validato solo lato server
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  ACCOUNT_DELETE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_STARTER_MONTHLY_PRICE_ID: z.string().min(1),
  STRIPE_STARTER_ANNUAL_PRICE_ID: z.string().min(1),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().min(1),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().min(1),
});

// ── Parse client vars (sempre) ────────────────────────────────────────
export const env = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

// ── Parse server vars (solo lato server) ──────────────────────────────
export const serverEnv = isServer
  ? serverSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      ACCOUNT_DELETE_WEBHOOK_SECRET: process.env.ACCOUNT_DELETE_WEBHOOK_SECRET,
      STRIPE_STARTER_MONTHLY_PRICE_ID:
        process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
      STRIPE_STARTER_ANNUAL_PRICE_ID:
        process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
      STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      STRIPE_PRO_ANNUAL_PRICE_ID: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    })
  : (undefined as unknown as z.infer<typeof serverSchema>);
