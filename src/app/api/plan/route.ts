import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Plan } from '@/lib/quota';

const PLAN_CREDITS: Record<Plan, number | null> = {
  free: 1,
  starter: 10,
  pro: null,
};

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
