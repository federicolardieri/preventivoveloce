import { stripe } from '@/lib/stripe';
import { sendAccountDeletedEmail } from '@/lib/email';

/**
 * Cancella tutte le subscription Stripe attive per un utente e invia l'email
 * di conferma eliminazione account. È idempotente e non solleva eccezioni:
 * errori Stripe/email vengono loggati ma non bloccano il flusso di cancellazione.
 *
 * Può essere invocata sia da /api/account/delete (eliminazione dalla dashboard
 * utente) sia da /api/account/on-deleted (trigger DB che notifica l'eliminazione
 * diretta dal database Supabase).
 */
export async function cleanupUserBilling({
  email,
  stripeCustomerId,
}: {
  email: string | null | undefined;
  stripeCustomerId: string | null | undefined;
}): Promise<{ cancelledSubscriptions: number; hadSubscription: boolean }> {
  let cancelled = 0;
  let hadSubscription = false;

  if (stripeCustomerId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 100,
      });

      const active = subs.data.filter(
        (s) => s.status !== 'canceled' && s.status !== 'incomplete_expired'
      );
      hadSubscription = active.length > 0;

      for (const sub of active) {
        try {
          await stripe.subscriptions.cancel(sub.id, { invoice_now: false, prorate: false });
          cancelled += 1;
        } catch (err) {
          console.error('[account-cleanup] stripe cancel error:', sub.id, err);
        }
      }
    } catch (err) {
      console.error('[account-cleanup] stripe list error:', err);
    }
  }

  if (email) {
    try {
      await sendAccountDeletedEmail({ to: email, hadSubscription });
    } catch (err) {
      console.error('[account-cleanup] email error:', err);
    }
  }

  return { cancelledSubscriptions: cancelled, hadSubscription };
}
