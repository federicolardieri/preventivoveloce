-- Aggiunge colonna IBAN alla tabella quotes
-- Il campo era usato nel frontend/PDF ma mancava nel DB,
-- causando errore PostgREST su loadFromSupabase (quotes non caricati dopo refresh)
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS iban text DEFAULT NULL;
