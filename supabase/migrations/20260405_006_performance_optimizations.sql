-- 1. Create missing indexes on foreign keys
CREATE INDEX IF NOT EXISTS companies_user_id_idx ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS notifications_quote_id_idx ON public.notifications(quote_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- 2. Drop existing unoptimized policies
DROP POLICY IF EXISTS "Utente vede solo il proprio profilo" ON public.profiles;

DROP POLICY IF EXISTS "Utente vede solo le proprie aziende" ON public.companies;

DROP POLICY IF EXISTS "Utente vede solo i propri abbonamenti" ON public.subscriptions;
DROP POLICY IF EXISTS "utente vede solo la sua subscription" ON public.subscriptions;

DROP POLICY IF EXISTS "Utente vede solo i propri preventivi" ON public.quotes;

DROP POLICY IF EXISTS "Utente vede solo i propri clienti" ON public.clients;

DROP POLICY IF EXISTS "owner can manage tokens" ON public.quote_tokens;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;

-- 3. Recreate policies with `(select auth.uid())` to prevent RLS initialization plan loop
CREATE POLICY "Utente vede solo il proprio profilo" ON public.profiles 
FOR ALL TO public USING ( (select auth.uid()) = id );

CREATE POLICY "Utente vede solo le proprie aziende" ON public.companies 
FOR ALL TO public USING ( (select auth.uid()) = user_id );

CREATE POLICY "Utente vede solo i propri abbonamenti" ON public.subscriptions 
FOR ALL TO public USING ( (select auth.uid()) = user_id );

CREATE POLICY "Utente vede solo i propri preventivi" ON public.quotes 
FOR ALL TO public USING ( (select auth.uid()) = user_id );

CREATE POLICY "Utente vede solo i propri clienti" ON public.clients 
FOR ALL TO public USING ( (select auth.uid()) = user_id );

CREATE POLICY "owner can manage tokens" ON public.quote_tokens 
FOR ALL TO public USING (
  EXISTS (
    SELECT 1 FROM public.quotes q 
    WHERE q.id = quote_tokens.quote_id 
    AND q.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users read own notifications" ON public.notifications 
FOR SELECT TO public USING ( (select auth.uid()) = user_id );

CREATE POLICY "Users update own notifications" ON public.notifications 
FOR UPDATE TO public USING ( (select auth.uid()) = user_id );
