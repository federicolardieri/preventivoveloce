-- ============================================================
-- Trigger BEFORE DELETE ON auth.users
--
-- Quando un utente viene eliminato (dalla dashboard Supabase, via
-- SQL diretto o da qualunque altro flusso), notifichiamo il nostro
-- endpoint Next.js /api/account/on-deleted che si occupa di:
--   1. cancellare l'abbonamento Stripe residuo
--   2. inviare l'email di conferma eliminazione
--
-- L'eliminazione via /api/account/delete marca prima l'utente con
-- app_metadata.billing_cleanup_done = true e fa cleanup/email in
-- modo sincrono: in quel caso l'endpoint vedrà il flag e skipperà,
-- evitando doppie email.
--
-- Richiede due GUC configurati a livello di database:
--   ALTER DATABASE postgres SET app.site_url = 'https://...';
--   ALTER DATABASE postgres SET app.account_webhook_secret = '...';
-- Il secret deve combaciare con ACCOUNT_DELETE_WEBHOOK_SECRET in Vercel.
-- ============================================================

-- ─── 1. Abilita pg_net per chiamate HTTP asincrone ────────────
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ─── 2. Funzione trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_url         TEXT;
  v_secret           TEXT;
  v_stripe_customer  TEXT;
  v_cleanup_done     BOOLEAN;
  v_payload          JSONB;
BEGIN
  -- Legge GUC; se non configurati il trigger è no-op (utile in locale/test)
  BEGIN
    v_site_url := current_setting('app.site_url', true);
    v_secret   := current_setting('app.account_webhook_secret', true);
  EXCEPTION WHEN OTHERS THEN
    v_site_url := NULL;
    v_secret   := NULL;
  END;

  IF v_site_url IS NULL OR v_site_url = '' OR v_secret IS NULL OR v_secret = '' THEN
    RAISE LOG 'handle_auth_user_deleted: app.site_url/app.account_webhook_secret non configurati, skip';
    RETURN OLD;
  END IF;

  -- Se /api/account/delete ha già gestito billing ed email lo segnala qui
  v_cleanup_done := COALESCE((OLD.raw_app_meta_data ->> 'billing_cleanup_done')::boolean, FALSE);

  -- Recupera stripe_customer_id dal profilo (ancora presente: siamo BEFORE DELETE,
  -- profiles verrà cascaded solo dopo il ritorno del trigger)
  SELECT stripe_customer_id INTO v_stripe_customer
  FROM public.profiles
  WHERE id = OLD.id;

  v_payload := jsonb_build_object(
    'user_id', OLD.id,
    'email', OLD.email,
    'stripe_customer_id', v_stripe_customer,
    'billing_cleanup_done', v_cleanup_done
  );

  -- Fire-and-forget: pg_net esegue la request in background,
  -- non blocca la DELETE né solleva errori se l'endpoint è giù.
  PERFORM net.http_post(
    url     := v_site_url || '/api/account/on-deleted',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    body    := v_payload,
    timeout_milliseconds := 5000
  );

  RETURN OLD;
END;
$$;

-- ─── 3. Trigger ───────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_deleted();
