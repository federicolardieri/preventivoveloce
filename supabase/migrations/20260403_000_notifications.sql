-- Tabella notifiche
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('credits_low', 'credits_empty', 'quote_sent', 'quote_accepted')),
  title text not null,
  message text not null,
  read boolean not null default false,
  quote_id uuid references quotes(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "Users read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- Trigger: crea notifica quando lo stato di un preventivo cambia in 'inviato' o 'accettato'
create or replace function notify_on_quote_status_change()
returns trigger language plpgsql security definer as $$
declare
  v_number text;
begin
  if old.status = new.status then return new; end if;

  v_number := new.number;

  if new.status = 'inviato' then
    insert into notifications (user_id, type, title, message, quote_id)
    values (
      new.user_id,
      'quote_sent',
      'Preventivo inviato',
      'Il preventivo ' || v_number || ' è stato inviato al cliente.',
      new.id
    );
  elsif new.status = 'accettato' then
    insert into notifications (user_id, type, title, message, quote_id)
    values (
      new.user_id,
      'quote_accepted',
      '🎉 Preventivo accettato!',
      'Il cliente ha accettato il preventivo ' || v_number || '.',
      new.id
    );
  end if;

  return new;
end;
$$;

create trigger trg_notify_quote_status
  after update on quotes
  for each row execute function notify_on_quote_status_change();

-- Trigger: crea notifica quando i crediti calano a 1 o 0
create or replace function notify_on_credits_change()
returns trigger language plpgsql security definer as $$
begin
  if old.credits_remaining = new.credits_remaining then return new; end if;

  if new.credits_remaining = 1 then
    insert into notifications (user_id, type, title, message)
    values (
      new.id,
      'credits_low',
      'Credito quasi esaurito',
      'Ti rimane solo 1 credito. Passa a Starter o Pro per continuare a creare preventivi.'
    );
  elsif new.credits_remaining = 0 then
    insert into notifications (user_id, type, title, message)
    values (
      new.id,
      'credits_empty',
      'Crediti esauriti',
      'Hai esaurito i tuoi crediti. Passa a Starter o Pro per sbloccare nuovi preventivi.'
    );
  end if;

  return new;
end;
$$;

create trigger trg_notify_credits
  after update of credits_remaining on profiles
  for each row execute function notify_on_credits_change();
