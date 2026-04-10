import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/cron/health
 *
 * Verifica che il cron job `downgrade_expired_plans` sia in esecuzione regolare.
 * Protetto da header Authorization: Bearer <CRON_HEALTH_SECRET>.
 *
 * Risposte:
 *  200 — ultimo run entro 26h, nessun errore
 *  500 — ultimo run > 26h oppure con errore
 *  401 — secret mancante o errato
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_HEALTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_HEALTH_SECRET non configurato' }, { status: 500 });
  }

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('cron.job_run_details' as 'notifications')
    .select('end_time, return_message, status')
    .eq('command' as 'type', 'select downgrade_expired_plans()')
    .order('end_time' as 'created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // cron.job_run_details potrebbe non essere accessibile via API PostgREST,
    // proviamo con una query raw via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'check_cron_health' as never,
    );

    if (rpcError) {
      return NextResponse.json({
        healthy: false,
        error: 'Impossibile leggere cron.job_run_details. Configura la RPC check_cron_health.',
        details: rpcError.message,
      }, { status: 500 });
    }

    return NextResponse.json(rpcData);
  }

  if (!data) {
    return NextResponse.json({
      healthy: false,
      error: 'Nessuna esecuzione trovata per downgrade_expired_plans',
    }, { status: 500 });
  }

  const endTime = new Date(data.end_time as string);
  const hoursSinceLastRun = (Date.now() - endTime.getTime()) / (1000 * 60 * 60);
  const hasError = String(data.return_message ?? '').toLowerCase().includes('error')
    || String(data.status ?? '') === 'failed';

  if (hoursSinceLastRun > 26 || hasError) {
    return NextResponse.json({
      healthy: false,
      last_run: endTime.toISOString(),
      hours_ago: Math.round(hoursSinceLastRun),
      return_message: data.return_message,
      status: data.status,
    }, { status: 500 });
  }

  return NextResponse.json({
    healthy: true,
    last_run: endTime.toISOString(),
    hours_ago: Math.round(hoursSinceLastRun),
  });
}
