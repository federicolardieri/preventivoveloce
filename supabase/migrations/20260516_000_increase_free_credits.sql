-- ============================================================
-- Aumenta crediti piano Free: da 1 a 10
--
-- Nuovi utenti ricevono 10 crediti alla registrazione.
-- Utenti free esistenti ricevono il boost retroattivo:
--   GREATEST(0, 10 - quotes_create)
-- La funzione di downgrade viene aggiornata di conseguenza.
-- ============================================================

-- ─── 1. Aggiorna trigger creazione utente ───────────────────
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
    10,
    NOW(),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─── 2. Aggiorna funzione di downgrade piani scaduti ────────
CREATE OR REPLACE FUNCTION public.downgrade_expired_plans()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE profiles
    SET
      plan = 'free',
      credits_remaining = GREATEST(0, 10 - COALESCE(
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

  IF v_count > 0 THEN
    RAISE LOG 'downgrade_expired_plans: % profili declassati a free', v_count;
  END IF;

  RETURN v_count;
END;
$$;

-- ─── 3. Boost retroattivo utenti free esistenti ─────────────
UPDATE profiles p
SET credits_remaining = GREATEST(0, 10 - COALESCE(
  (SELECT COUNT(*)::INTEGER FROM quotes q WHERE q.user_id = p.id),
  0
))
WHERE (p.plan = 'free' OR p.plan IS NULL)
  AND COALESCE(p.credits_remaining, 0) < 10;
