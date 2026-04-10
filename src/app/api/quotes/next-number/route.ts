import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('next_quote_number', {
    p_user_id: user.id,
  });

  if (error) {
    logError('quotes.next-number', error);
    return NextResponse.json({ error: 'Errore generazione numero' }, { status: 500 });
  }

  return NextResponse.json({ number: data });
}
