-- ============================================================
-- Follow-up: config da Supabase Vault
--
-- Supabase non consente più ALTER DATABASE ... SET app.*, quindi i GUC
-- app.site_url / app.followup_webhook_secret non sono configurabili e il
-- job saltava sempre. La funzione ora legge da Vault:
--   followup_site_url        — es. https://www.ilpreventivoveloce.it
--   followup_webhook_secret  — deve combaciare con FOLLOWUP_WEBHOOK_SECRET in Vercel
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_pending_followups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_url text;
  v_secret   text;
  v_row      RECORD;
BEGIN
  SELECT decrypted_secret INTO v_site_url
  FROM vault.decrypted_secrets WHERE name = 'followup_site_url';

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets WHERE name = 'followup_webhook_secret';

  IF v_site_url IS NULL OR v_site_url = ''
     OR v_secret IS NULL OR v_secret = '' THEN
    RAISE LOG 'process_pending_followups: secret Vault non configurati, skip';
    RETURN;
  END IF;

  FOR v_row IN
    SELECT id
    FROM public.quote_followups
    WHERE status = 'pending'
      AND scheduled_for IS NOT NULL
      AND scheduled_for <= now()
  LOOP
    PERFORM net.http_post(
      url     := v_site_url || '/api/email/send-followup',
      headers := jsonb_build_object(
        'Content-Type',     'application/json',
        'x-webhook-secret', v_secret
      ),
      body    := jsonb_build_object('followupId', v_row.id::text),
      timeout_milliseconds := 5000
    );
  END LOOP;
END;
$$;
