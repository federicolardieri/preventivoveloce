-- Funzione per attivare/aggiornare il piano di un utente
-- Chiamata dal webhook Stripe dopo ogni evento di subscription

CREATE OR REPLACE FUNCTION activate_plan(
  p_user_id UUID,
  p_plan TEXT,
  p_duration_days INTEGER DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Calcola crediti e date in base al piano
  CASE p_plan
    WHEN 'starter' THEN
      v_credits := 10;
      v_reset_at := NOW() + INTERVAL '30 days';
      v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
    WHEN 'pro' THEN
      v_credits := NULL; -- illimitato
      v_reset_at := NULL;
      v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
    ELSE -- free
      v_credits := 1;
      v_reset_at := NULL;
      v_expires_at := NULL;
  END CASE;

  UPDATE profiles
  SET
    plan = p_plan,
    credits_remaining = v_credits,
    credits_reset_at = v_reset_at,
    plan_expires_at = v_expires_at,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- RLS per la tabella subscriptions (se non già presente)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions'
    AND policyname = 'utente vede solo la sua subscription'
  ) THEN
    CREATE POLICY "utente vede solo la sua subscription"
      ON subscriptions
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END;
$$;
