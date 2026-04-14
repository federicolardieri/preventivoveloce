-- ============================================================
-- Aggiunge stato follow_up_inviato ai preventivi
-- e tipo followup_sent alle notifiche
-- ============================================================

-- Aggiunge CHECK constraint su quotes.status
-- (la colonna era TEXT NOT NULL senza constraint — questo lo aggiunge)
ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check
    CHECK (status IN (
      'bozza', 'da_inviare', 'inviato', 'follow_up_inviato',
      'accettato', 'rifiutato', 'scaduto'
    ));

-- Allarga il CHECK inline su notifications.type
-- Il constraint inline ha nome auto-generato notifications_type_check in PostgreSQL
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'credits_low', 'credits_empty', 'quote_sent', 'quote_accepted', 'quote_opened', 'followup_sent'
    ));
