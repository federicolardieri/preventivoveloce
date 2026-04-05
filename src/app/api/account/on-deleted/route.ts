import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { cleanupUserBilling } from '@/lib/account-cleanup';

/**
 * Endpoint invocato dal trigger SQL `on_auth_user_deleted` quando un utente
 * viene eliminato direttamente dal database (es. dashboard Supabase) senza
 * passare da /api/account/delete. Cancella la subscription Stripe residua
 * e invia l'email di conferma eliminazione.
 *
 * Protetto da un secret condiviso (ACCOUNT_DELETE_WEBHOOK_SECRET) che il
 * trigger include nell'header `x-webhook-secret`.
 */
export async function POST(request: Request) {
  const secret = process.env.ACCOUNT_DELETE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[on-deleted] ACCOUNT_DELETE_WEBHOOK_SECRET non configurato');
    return NextResponse.json({ error: 'Non configurato' }, { status: 500 });
  }

  const provided = request.headers.get('x-webhook-secret') ?? '';
  const expectedBuf = Buffer.from(secret);
  const providedBuf = Buffer.from(provided);
  if (
    expectedBuf.length !== providedBuf.length ||
    !timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  let payload: {
    user_id?: string;
    email?: string | null;
    stripe_customer_id?: string | null;
    billing_cleanup_done?: boolean;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  // Se l'eliminazione è partita da /api/account/delete abbiamo già eseguito
  // cleanup + email: il trigger lo comunica via questo flag, noi skippiamo
  // per evitare doppie email e chiamate Stripe inutili.
  if (payload.billing_cleanup_done) {
    return NextResponse.json({ skipped: true });
  }

  if (!payload.user_id) {
    return NextResponse.json({ error: 'user_id mancante' }, { status: 400 });
  }

  const result = await cleanupUserBilling({
    email: payload.email ?? null,
    stripeCustomerId: payload.stripe_customer_id ?? null,
  });

  return NextResponse.json({ ok: true, ...result });
}
