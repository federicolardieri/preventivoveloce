import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { executeSendFollowUp } from '@/lib/send-followup';
import { logError } from '@/lib/logger';

const SECRET = process.env.FOLLOWUP_WEBHOOK_SECRET ?? '';

function verifySecret(req: NextRequest): boolean {
  const header = req.headers.get('x-webhook-secret') ?? '';
  if (!SECRET || !header || header.length !== SECRET.length) return false;
  return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(SECRET));
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const parsed = z.object({ followupId: z.string().regex(uuidRegex) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'followupId non valido' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const result = await executeSendFollowUp(parsed.data.followupId, admin);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logError('send-followup.route', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
