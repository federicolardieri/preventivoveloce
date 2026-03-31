import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false, confirmed: false });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      console.error('[check-email] listUsers error:', error);
      return NextResponse.json({ debug: error.message, error: 'Errore interno' }, { status: 500 });
    }

    const user = data.users.find(
      (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ exists: false, confirmed: false });
    }

    return NextResponse.json({
      exists: true,
      confirmed: !!user.email_confirmed_at,
    });
  } catch (err) {
    console.error('[check-email] exception:', err);
    return NextResponse.json({ debug: String(err), error: 'Errore interno' }, { status: 500 });
  }
}
