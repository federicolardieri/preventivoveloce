-- Tabella token per accettazione preventivi da parte del cliente
create table if not exists public.quote_tokens (
  id            uuid primary key default gen_random_uuid(),
  quote_id      uuid not null references public.quotes(id) on delete cascade,
  token         text unique not null,
  expires_at    timestamptz not null,
  accepted_at   timestamptz,
  accepted_ip   text,
  created_at    timestamptz not null default now()
);

-- Solo il proprietario della quote può leggere/creare i suoi token
alter table public.quote_tokens enable row level security;

create policy "owner can manage tokens"
  on public.quote_tokens
  for all
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_tokens.quote_id
        and q.user_id = auth.uid()
    )
  );

-- La pagina pubblica legge il token senza autenticazione (via service_role in API route)
-- Le API route /api/firma/* usano il service_role key, quindi bypassano RLS

-- Indice per lookup rapido del token
create index if not exists quote_tokens_token_idx on public.quote_tokens(token);
create index if not exists quote_tokens_quote_id_idx on public.quote_tokens(quote_id);
