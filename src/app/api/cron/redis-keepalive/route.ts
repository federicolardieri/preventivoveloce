import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { pingRedis } from '@/lib/ratelimit';
import { logError } from '@/lib/logger';

// Upstash deletes free databases after 14 days without commands: a daily Vercel cron keeps it alive.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET non configurato' }, { status: 500 });
  }

  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(req.headers.get('authorization') ?? '');
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const result = await pingRedis();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    logError('cron.redis-keepalive', e);
    return NextResponse.json({ ok: false, error: 'Redis non raggiungibile' }, { status: 503 });
  }
}
