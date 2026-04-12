-- Add open tracking columns to quote_tokens
ALTER TABLE public.quote_tokens
  ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_count INTEGER NOT NULL DEFAULT 0;

-- Allow 'quote_opened' notification type
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY['credits_low','credits_empty','quote_sent','quote_accepted','quote_opened']));
