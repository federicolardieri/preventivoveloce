-- ============================================================
-- Fix advisor: "function_search_path_mutable"
--
-- Le funzioni sottostanti erano dichiarate senza `SET search_path`,
-- il che apre un vettore di privilege escalation per chiunque possa
-- creare oggetti nello schema di ricerca del chiamante. Le
-- ricreiamo aggiungendo `SET search_path = public` (e `pg_temp`
-- per sicurezza) mantenendo comportamento identico.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_credits_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF old.credits_remaining = new.credits_remaining THEN
    RETURN new;
  END IF;

  IF new.credits_remaining = 1 THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      new.id,
      'credits_low',
      'Credito quasi esaurito',
      'Ti rimane solo 1 credito. Passa a Starter o Pro per continuare a creare preventivi.'
    );
  ELSIF new.credits_remaining = 0 THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      new.id,
      'credits_empty',
      'Crediti esauriti',
      'Hai esaurito i tuoi crediti. Passa a Starter o Pro per sbloccare nuovi preventivi.'
    );
  END IF;

  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_quote_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_number text;
BEGIN
  IF old.status = new.status THEN
    RETURN new;
  END IF;

  v_number := new.number;

  IF new.status = 'inviato' THEN
    INSERT INTO notifications (user_id, type, title, message, quote_id)
    VALUES (
      new.user_id,
      'quote_sent',
      'Preventivo inviato',
      'Il preventivo ' || v_number || ' è stato inviato al cliente.',
      new.id
    );
  ELSIF new.status = 'accettato' THEN
    INSERT INTO notifications (user_id, type, title, message, quote_id)
    VALUES (
      new.user_id,
      'quote_accepted',
      '🎉 Preventivo accettato!',
      'Il cliente ha accettato il preventivo ' || v_number || '.',
      new.id
    );
  END IF;

  RETURN new;
END;
$$;
