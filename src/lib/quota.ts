import { createClient, createAdminClient } from '@/lib/supabase/server';

export type Plan = 'free' | 'starter' | 'pro';

const PLAN_CREDITS: Record<Plan, number | null> = {
  free: 1,       // 1 credito totale, mai resetta
  starter: 10,   // 10 crediti per ciclo di 30 giorni
  pro: null,     // illimitato per la durata dell'abbonamento
};

interface QuotaResult {
  allowed: boolean;
  plan: Plan;
  creditsRemaining: number | null; // null = illimitato (pro attivo)
  creditsTotal: number | null;
  /** true se la quote ID è già salvata nel DB (re-download consentito) */
  isExistingQuote: boolean;
  /** Data scadenza piano (null se free) */
  planExpiresAt: string | null;
  message?: string;
}

/**
 * Controlla lato server se l'utente può generare/scaricare un nuovo preventivo.
 *
 * Flusso crediti:
 * - Free: 1 credito totale (mai resetta, non scade)
 * - Starter: 10 crediti per ciclo 30gg. Alla scadenza decade a Free.
 * - Pro: illimitato per la durata dell'abbonamento. Alla scadenza decade a Free.
 *
 * La scadenza è controllata da `plan_expires_at`. Se è passata,
 * il piano viene automaticamente declassato a Free nel DB.
 */
export async function checkQuota(quoteId: string): Promise<QuotaResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      plan: 'free',
      creditsRemaining: 0,
      creditsTotal: 1,
      isExistingQuote: false,
      planExpiresAt: null,
      message: 'Utente non autenticato.',
    };
  }

  const admin = createAdminClient();

  // Legge profilo con crediti e scadenza
  const { data: profile } = await admin
    .from('profiles')
    .select('plan, credits_remaining, credits_reset_at, plan_expires_at')
    .eq('id', user.id)
    .single();

  let plan: Plan = (profile?.plan ?? 'free') as Plan;
  let creditsRemaining = profile?.credits_remaining ?? 0;
  const planExpiresAt = profile?.plan_expires_at ?? null;

  // ── Controllo scadenza piano ──────────────────────────────────────────
  // Se il piano è a pagamento e plan_expires_at è nel passato → downgrade a Free
  if (plan !== 'free' && planExpiresAt) {
    const expiresAt = new Date(planExpiresAt);
    if (expiresAt < new Date()) {
      // Piano scaduto → downgrade a Free
      // Calcola crediti free residui: max(0, 1 - quote_totali)
      const { count: totalQuotes } = await admin
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const freeCredits = Math.max(0, 1 - (totalQuotes ?? 0));

      await admin
        .from('profiles')
        .update({
          plan: 'free',
          credits_remaining: freeCredits,
          plan_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      plan = 'free';
      creditsRemaining = freeCredits;
    }
  }

  const creditsTotal = PLAN_CREDITS[plan];

  // Pro attivo: sempre permesso
  if (plan === 'pro') {
    return {
      allowed: true,
      plan,
      creditsRemaining: null,
      creditsTotal: null,
      isExistingQuote: false,
      planExpiresAt,
    };
  }

  // Controlla se la quote esiste già nel DB (re-download consentito, no crediti consumati)
  if (quoteId) {
    // Usa due strategie: prima con user_id, poi solo con id (fallback)
    const { count: existingCount, error: existError } = await admin
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('id', quoteId);

    const found = !existError && (existingCount ?? 0) > 0;

    // Fallback: se la query con user_id fallisce, prova solo con id
    if (!found && existError) {
      const { count: fallbackCount } = await admin
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('id', quoteId);

      if ((fallbackCount ?? 0) > 0) {
        return {
          allowed: true,
          plan,
          creditsRemaining,
          creditsTotal,
          isExistingQuote: true,
          planExpiresAt,
        };
      }
    }

    if (found) {
      return {
        allowed: true,
        plan,
        creditsRemaining,
        creditsTotal,
        isExistingQuote: true,
        planExpiresAt,
      };
    }
  }

  // Reset crediti per ciclo Starter (ogni 30 giorni dal reset precedente)
  if (plan === 'starter' && profile?.credits_reset_at) {
    const resetDate = new Date(profile.credits_reset_at);
    const now = new Date();
    const daysSinceReset = (now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceReset >= 30) {
      const { data: resetResult } = await admin
        .rpc('reset_monthly_credits', { p_user_id: user.id, p_plan: plan });
      creditsRemaining = resetResult ?? 10;
    }
  }

  const allowed = creditsRemaining > 0;

  return {
    allowed,
    plan,
    creditsRemaining,
    creditsTotal,
    isExistingQuote: false,
    planExpiresAt,
    message: allowed
      ? undefined
      : plan === 'free'
        ? 'Il piano Free permette 1 preventivo totale. Passa a Starter o Pro per continuare.'
        : `Hai esaurito i tuoi ${creditsTotal} crediti per questo ciclo. Passa a Pro per preventivi illimitati.`,
  };
}
