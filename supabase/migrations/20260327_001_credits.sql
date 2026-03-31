-- ============================================================
-- Preventivo Veloce — Sistema Crediti + Scadenza Piano
--
-- Ogni piano ha una durata:
--   Free:    nessuna scadenza, 1 credito totale
--   Starter: 30 giorni, 10 crediti per ciclo
--   Pro:     30 giorni, illimitato
--
-- Alla scadenza (plan_expires_at < NOW()) il piano decade a Free.
-- I crediti consumati NON vengono mai restituiti (anti-bypass).
-- ============================================================

-- ─── 1. Aggiungi colonne crediti al profilo ─────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits_remaining INTEGER,
  ADD COLUMN IF NOT EXISTS credits_reset_at   TIMESTAMPTZ DEFAULT NOW();

-- ─── 2. Popola crediti per utenti esistenti ─────────────────

-- Free users: max(0, 1 - quotes_count)
UPDATE profiles p
SET credits_remaining = GREATEST(0, 1 - COALESCE((
  SELECT COUNT(*)::INTEGER FROM quotes q WHERE q.user_id = p.id
), 0)),
    credits_reset_at = NOW()
WHERE p.plan = 'free' OR p.plan IS NULL;

-- Starter users: max(0, 10 - quotes_in_current_cycle)
-- Il ciclo parte da credits_reset_at (o plan_expires_at - 30gg)
UPDATE profiles p
SET credits_remaining = GREATEST(0, 10 - COALESCE((
  SELECT COUNT(*)::INTEGER FROM quotes q
  WHERE q.user_id = p.id
    AND q.created_at >= COALESCE(p.credits_reset_at, NOW() - INTERVAL '30 days')
), 0)),
    credits_reset_at = COALESCE(p.credits_reset_at, NOW())
WHERE p.plan = 'starter';

-- Pro users: NULL = illimitato (finché il piano è attivo)
UPDATE profiles p
SET credits_remaining = NULL,
    credits_reset_at = NOW()
WHERE p.plan = 'pro';

-- ─── 3. Aggiorna trigger creazione utente ───────────────────
-- Nuovo utente → piano free con 1 credito, nessuna scadenza
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, avatar_url,
    plan, credits_remaining, credits_reset_at, plan_expires_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    'free',
    1,
    NOW(),
    NULL  -- Free non scade
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─── 4. Trigger: consuma 1 credito per ogni nuovo preventivo ─
-- Scatta solo su INSERT (non UPDATE), quindi modificare un preventivo
-- esistente NON consuma crediti. Eliminare un preventivo NON li restituisce.
CREATE OR REPLACE FUNCTION public.consume_credit_on_quote_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrementa solo se credits_remaining IS NOT NULL (NULL = pro illimitato)
  UPDATE profiles
  SET credits_remaining = GREATEST(0, credits_remaining - 1),
      updated_at = NOW()
  WHERE id = NEW.user_id
    AND credits_remaining IS NOT NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consume_credit_on_quote ON quotes;

CREATE TRIGGER consume_credit_on_quote
  AFTER INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION public.consume_credit_on_quote_insert();

-- ─── 5. Funzione: reset crediti per nuovo ciclo (Starter) ───
-- Chiamata da checkQuota quando rileva che sono passati 30+ giorni dal reset
CREATE OR REPLACE FUNCTION public.reset_monthly_credits(p_user_id UUID, p_plan TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_credits INTEGER;
BEGIN
  IF p_plan = 'starter' THEN
    new_credits := 10;
  ELSIF p_plan = 'free' THEN
    RETURN (SELECT credits_remaining FROM profiles WHERE id = p_user_id);
  ELSE
    -- Pro: illimitato (gestito dal codice applicativo)
    RETURN -1;
  END IF;

  UPDATE profiles
  SET credits_remaining = new_credits,
      credits_reset_at = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN new_credits;
END;
$$;

-- ─── 6. Funzione helper: attivazione piano a pagamento ──────
-- Da chiamare dal webhook Stripe quando un abbonamento viene attivato/rinnovato.
-- Imposta piano, crediti e scadenza a +30 giorni.
CREATE OR REPLACE FUNCTION public.activate_plan(
  p_user_id UUID,
  p_plan TEXT,
  p_duration_days INTEGER DEFAULT 30
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET plan = p_plan,
      credits_remaining = CASE
        WHEN p_plan = 'pro' THEN NULL          -- illimitato
        WHEN p_plan = 'starter' THEN 10        -- 10 per ciclo
        ELSE 1                                  -- free
      END,
      credits_reset_at = NOW(),
      plan_expires_at = CASE
        WHEN p_plan = 'free' THEN NULL          -- free non scade
        ELSE NOW() + (p_duration_days || ' days')::INTERVAL
      END,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;
