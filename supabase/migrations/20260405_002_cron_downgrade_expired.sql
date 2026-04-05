-- ============================================================
-- Cron job: downgrade piani scaduti ogni giorno a mezzanotte
--
-- Attualmente il downgrade avviene "lazy" in checkQuota()
-- quando l'utente accede. Questo cron garantisce che i profili
-- vengano aggiornati anche se l'utente non accede per settimane.
-- ============================================================

-- ─── 1. Abilita pg_cron ────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Permetti a pg_cron di eseguire job nel database corrente
GRANT USAGE ON SCHEMA cron TO postgres;

-- ─── 2. Funzione di downgrade ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.downgrade_expired_plans()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Aggiorna tutti i profili con piano scaduto
  WITH expired AS (
    UPDATE profiles
    SET
      plan = 'free',
      credits_remaining = GREATEST(0, 1 - COALESCE(
        (SELECT COUNT(*)::INTEGER FROM quotes q WHERE q.user_id = profiles.id),
        0
      )),
      credits_reset_at = NULL,
      plan_expires_at = NULL,
      updated_at = NOW()
    WHERE plan IN ('starter', 'pro')
      AND plan_expires_at IS NOT NULL
      AND plan_expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  -- Log opzionale
  IF v_count > 0 THEN
    RAISE LOG 'downgrade_expired_plans: % profili declassati a free', v_count;
  END IF;

  RETURN v_count;
END;
$$;

-- ─── 3. Schedula: ogni giorno alle 00:05 UTC ──────────────────
SELECT cron.schedule(
  'downgrade-expired-plans',   -- nome job
  '5 0 * * *',                 -- ogni giorno alle 00:05 UTC
  $$SELECT public.downgrade_expired_plans()$$
);
