-- ============================================================
-- Preventivo Veloce — Schema iniziale
-- Esegui questa migration nel SQL Editor di Supabase Dashboard
-- oppure con: supabase db push
-- ============================================================

-- ─── PROFILES ────────────────────────────────────────────────
-- Estende auth.users con dati profilo e piano
CREATE TABLE IF NOT EXISTS profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name          TEXT,
  avatar_url         TEXT,
  stripe_customer_id TEXT UNIQUE,
  plan               TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  plan_expires_at    TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utente vede solo il proprio profilo"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- ─── COMPANIES ───────────────────────────────────────────────
-- Aziende mittenti (da profileStore, supporta più aziende per utente)
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT,
  postal_code   TEXT,
  country       TEXT,
  vat_number    TEXT,
  email         TEXT,
  phone         TEXT,
  logo          TEXT,            -- base64 jpeg compressa
  custom_fields JSONB DEFAULT '[]',
  is_default    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utente vede solo le proprie aziende"
  ON companies FOR ALL
  USING (auth.uid() = user_id);

-- ─── QUOTES ──────────────────────────────────────────────────
-- Preventivi (struttura JSONB per preservare la complessità dei dati)
CREATE TABLE IF NOT EXISTS quotes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number              TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'bozza',
  template            TEXT NOT NULL DEFAULT 'classic',
  theme               JSONB NOT NULL DEFAULT '{}',
  sender              JSONB NOT NULL DEFAULT '{}',
  client              JSONB NOT NULL DEFAULT '{}',
  items               JSONB NOT NULL DEFAULT '[]',
  notes               TEXT DEFAULT '',
  payment_terms       TEXT DEFAULT '',
  validity_days       INTEGER DEFAULT 30,
  currency            TEXT DEFAULT 'EUR',
  item_custom_columns JSONB DEFAULT '[]',
  total_cents         INTEGER DEFAULT 0,  -- denormalizzato per sort/filter veloce
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utente vede solo i propri preventivi"
  ON quotes FOR ALL
  USING (auth.uid() = user_id);

-- Indice per query frequenti
CREATE INDEX IF NOT EXISTS quotes_user_id_created_at_idx ON quotes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quotes_user_id_status_idx ON quotes (user_id, status);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────
-- Abbonamenti Stripe (da popolare nella Sessione 2)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   TEXT PRIMARY KEY,   -- Stripe subscription ID
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status               TEXT NOT NULL,      -- active | canceled | past_due | trialing
  price_id             TEXT,
  product_id           TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utente vede solo i propri abbonamenti"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- ─── TRIGGER: crea profilo alla registrazione ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Rimuovi il trigger se esiste già (per idempotenza)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── TRIGGER: aggiorna updated_at automaticamente ─────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
