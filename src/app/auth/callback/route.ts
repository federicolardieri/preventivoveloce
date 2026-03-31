import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/welcome';

  const flow = searchParams.get('flow');
  const supabase = await createClient();

  const checkNewUserOnLogin = async (): Promise<NextResponse | null> => {
    if (flow !== 'login') return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const isNewUser = Date.now() - new Date(user.created_at).getTime() < 60_000;
    if (isNewUser) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=no_google_account`);
    }
    return null;
  };

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const block = await checkNewUserOnLogin();
      if (block) return block;
      return NextResponse.redirect(`${origin}${next}`);
    }
    const isExpired = error.message?.toLowerCase().includes('expired');
    return NextResponse.redirect(
      `${origin}/login?error=${isExpired ? 'link_expired' : 'auth_callback_failed'}`
    );
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    const isExpired = error.message?.toLowerCase().includes('expired');
    return NextResponse.redirect(
      `${origin}/login?error=${isExpired ? 'link_expired' : 'auth_callback_failed'}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
