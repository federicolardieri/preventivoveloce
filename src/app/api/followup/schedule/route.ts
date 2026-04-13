import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { executeSendFollowUp } from '@/lib/send-followup';
import { logError } from '@/lib/logger';

const scheduleSchema = z.object({
  quoteId: z.string().min(1),
  scheduledFor: z.string().datetime().nullable(),
  templateId: z.enum(['reminder_1', 'reminder_2', 'custom']),
  customMessage: z.string().max(1000).default(''),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Input non valido' },
      { status: 400 }
    );
  }

  const { quoteId, scheduledFor, templateId, customMessage } = parsed.data;

  if (scheduledFor && new Date(scheduledFor) <= new Date()) {
    return NextResponse.json(
      { error: 'La data di programmazione deve essere nel futuro' },
      { status: 400 }
    );
  }

  // Verifica che il preventivo appartenga all'utente
  const { data: quote, error: quoteErr } = await supabase
    .from('quotes')
    .select('id')
    .eq('id', quoteId)
    .eq('user_id', user.id)
    .single();

  if (quoteErr || !quote) {
    return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
  }

  try {
    const admin = createAdminClient();

    // Inserisce il record
    const { data: followup, error: insertErr } = await admin
      .from('quote_followups')
      .insert({
        quote_id: quoteId,
        user_id: user.id,
        scheduled_for: scheduledFor,
        status: 'pending',
        template_id: templateId,
        custom_message: customMessage,
      })
      .select('id')
      .single();

    if (insertErr || !followup) {
      logError('followup.schedule.insert', insertErr);
      return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }

    // Immediato: esegui subito
    if (scheduledFor === null) {
      const result = await executeSendFollowUp(followup.id, admin);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 422 });
      }
      return NextResponse.json({ ok: true, immediate: true });
    }

    return NextResponse.json({ ok: true, followupId: followup.id, scheduledFor });
  } catch (err) {
    logError('followup.schedule', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
