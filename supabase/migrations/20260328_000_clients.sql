-- ============================================================
-- Preventivo Veloce — Rubrica Clienti
-- Tabella clients per salvare e riutilizzare i dati cliente
-- ============================================================

-- ─── CLIENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
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
  custom_fields JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utente vede solo i propri clienti"
  ON clients FOR ALL
  USING (auth.uid() = user_id);

-- Indice per query frequenti
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients (user_id);

-- Trigger updated_at
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Colonna client_id su quotes (opzionale, per conteggio) ─
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS quotes_client_id_idx ON quotes (client_id);
