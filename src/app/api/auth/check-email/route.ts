import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkCheckEmailRateLimit } from '@/lib/ratelimit';

const checkEmailSchema = z.object({
  email: z.string().email().max(255),
});

export async function POST(request: Request) {
  try {
    // Rate limit per IP: max 5/min
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rl = await checkCheckEmailRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json({ exists: false, confirmed: false });
    }

    const parsed = checkEmailSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ exists: false, confirmed: false });
    }
    const { email } = parsed.data;

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('check_email_exists', {
      p_email: email.trim().toLowerCase(),
    });

    if (error) {
      console.error('[check-email] rpc error:', error);
      return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ exists: false, confirmed: false });
    }

    return NextResponse.json({
      exists: data.user_exists,
      confirmed: data.email_confirmed,
    });
  } catch (err) {
    console.error('[check-email] exception:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
