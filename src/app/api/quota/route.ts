import { NextRequest, NextResponse } from 'next/server';
import { checkQuota } from '@/lib/quota';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const quoteId = req.nextUrl.searchParams.get('quoteId') ?? '';
  const result = await checkQuota(quoteId);
  return NextResponse.json(result);
}
