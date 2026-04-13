-- ============================================================
-- Follow-up preventivi
--
-- Tabella per tracciare i follow-up (istantanei e programmati).
-- Il job pg_cron processa i record pending ogni 5 minuti chiamando
-- /api/email/send-followup via pg_net.
--
-- GUC richiesti (configurati via SQL dopo questa migration):
--   app.site_url              — URL pubblico (già configurato)
--   app.followup_webhook_secret — deve combaciare con FOLLOWUP_WEBHOOK_SECRET in Vercel
-- ============================================================

-- ─── 1. Tabella ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_followups (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id       uuid        NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  scheduled_for  timestamptz,
  status         text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'sent', 'failed')),
  template_id    text        NOT NULL DEFAULT 'custom'
                               CHECK (template_id IN ('reminder_1', 'reminder_2', 'custom')),
  custom_message text        NOT NULL DEFAULT '',
  sent_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Indice per il job pg_cron
CREATE INDEX IF NOT EXISTS quote_followups_pending_idx
  ON public.quote_followups (scheduled_for)
  WHERE status = 'pending';

-- ─── 2. RLS ───────────────────────────────────────────────────
ALTER TABLE public.quote_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own followups"
  ON public.quote_followups
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 3. Funzione di processing (chiamata da pg_cron) ──────────
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
  BEGIN
    v_site_url := current_setting('app.site_url', true);
    v_secret   := current_setting('app.followup_webhook_secret', true);
  EXCEPTION WHEN OTHERS THEN
    v_site_url := NULL;
    v_secret   := NULL;
  END;

  IF v_site_url IS NULL OR v_site_url = ''
     OR v_secret IS NULL OR v_secret = '' THEN
    RAISE LOG 'process_pending_followups: GUC non configurati, skip';
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

-- ─── 4. Schedula pg_cron ogni 5 minuti ───────────────────────
SELECT cron.schedule(
  'process-followups',
  '*/5 * * * *',
  $$SELECT public.process_pending_followups()$$
);
