import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Plan } from '@/lib/quota';

const PLAN_CREDITS: Record<Plan, number | null> = {
  free: 1,
  starter: 10,
  pro: null,
};

/**
 * POST /api/plan — Cambia piano (fake, senza Stripe).
 * Body: { plan: 'free' | 'starter' | 'pro' }
 *
 * In produzione verrà sostituito dal webhook Stripe.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: Plan };

  if (!['free', 'starter', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Piano non valido' }, { status: 400 });
  }

  const admin = createAdminClient();

  const credits = PLAN_CREDITS[plan];
  const expiresAt = plan === 'free'
    ? null
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 giorni

  const { error } = await admin
    .from('profiles')
    .update({
      plan,
      credits_remaining: credits,
      credits_reset_at: new Date().toISOString(),
      plan_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    plan,
    credits_remaining: credits,
    plan_expires_at: expiresAt,
  });
}

/**
 * GET /api/plan — Legge piano e crediti attuali.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('plan, credits_remaining, credits_reset_at, plan_expires_at')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    plan: profile?.plan ?? 'free',
    creditsRemaining: profile?.credits_remaining ?? 0,
    creditsTotal: PLAN_CREDITS[(profile?.plan ?? 'free') as Plan],
    planExpiresAt: profile?.plan_expires_at ?? null,
    creditsResetAt: profile?.credits_reset_at ?? null,
  });
}
