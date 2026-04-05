-- Drop existing policies that lack explicit WITH CHECK
DROP POLICY IF EXISTS "Utente vede solo il proprio profilo" ON public.profiles;
DROP POLICY IF EXISTS "Utente vede solo le proprie aziende" ON public.companies;
DROP POLICY IF EXISTS "Utente vede solo i propri abbonamenti" ON public.subscriptions;
DROP POLICY IF EXISTS "Utente vede solo i propri preventivi" ON public.quotes;
DROP POLICY IF EXISTS "Utente vede solo i propri clienti" ON public.clients;
DROP POLICY IF EXISTS "owner can manage tokens" ON public.quote_tokens;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;

-- Recreate policies with EXPLICIT WITH CHECK clauses to prevent privilege escalation via mutating owners

CREATE POLICY "Utente vede solo il proprio profilo" ON public.profiles 
FOR ALL TO public 
USING ( (select auth.uid()) = id )
WITH CHECK ( (select auth.uid()) = id );

CREATE POLICY "Utente vede solo le proprie aziende" ON public.companies 
FOR ALL TO public 
USING ( (select auth.uid()) = user_id )
WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "Utente vede solo i propri abbonamenti" ON public.subscriptions 
FOR ALL TO public 
USING ( (select auth.uid()) = user_id )
WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "Utente vede solo i propri preventivi" ON public.quotes 
FOR ALL TO public 
USING ( (select auth.uid()) = user_id )
WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "Utente vede solo i propri clienti" ON public.clients 
FOR ALL TO public 
USING ( (select auth.uid()) = user_id )
WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "owner can manage tokens" ON public.quote_tokens 
FOR ALL TO public 
USING (
  EXISTS (
    SELECT 1 FROM public.quotes q 
    WHERE q.id = quote_tokens.quote_id 
    AND q.user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quotes q 
    WHERE q.id = quote_tokens.quote_id 
    AND q.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users update own notifications" ON public.notifications 
FOR UPDATE TO public 
USING ( (select auth.uid()) = user_id )
WITH CHECK ( (select auth.uid()) = user_id );
