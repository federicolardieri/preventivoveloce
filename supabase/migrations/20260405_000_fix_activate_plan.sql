-- Fix: credits_reset_at was set to NOW() + 30 days (future) instead of NOW()
-- This caused Starter plan credits to never reset correctly.
-- Also converts consume_credit trigger to BEFORE INSERT with credit check
-- to prevent race conditions on parallel inserts.

-- ─── 1. Fix activate_plan: credits_reset_at = NOW() ────────────
CREATE OR REPLACE FUNCTION activate_plan(
  p_user_id UUID,
  p_plan TEXT,
  p_duration_days INTEGER DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
BEGIN
  CASE p_plan
    WHEN 'starter' THEN
      v_credits := 10;
      v_reset_at := NOW();                                          -- fixed
      v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
    WHEN 'pro' THEN
      v_credits := NULL;
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

-- ─── 2. Atomic credit consumption (BEFORE INSERT with lock) ────
-- Replaces the old AFTER INSERT trigger that had a race condition.
-- Now uses SELECT ... FOR UPDATE to lock the profile row before
-- checking and decrementing credits.

CREATE OR REPLACE FUNCTION public.consume_credit_on_quote_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  -- Lock the profile row to prevent concurrent inserts
  SELECT credits_remaining INTO v_credits
  FROM profiles
  WHERE id = NEW.user_id
  FOR UPDATE;

  -- NULL means unlimited (pro plan)
  IF v_credits IS NULL THEN
    RETURN NEW;
  END IF;

  -- Block insert if no credits left
  IF v_credits <= 0 THEN
    RAISE EXCEPTION 'No credits remaining';
  END IF;

  -- Decrement credit
  UPDATE profiles
  SET credits_remaining = v_credits - 1,
      updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Recreate trigger as BEFORE INSERT (was AFTER INSERT)
DROP TRIGGER IF EXISTS consume_credit_on_quote ON quotes;

CREATE TRIGGER consume_credit_on_quote
  BEFORE INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION public.consume_credit_on_quote_insert();
