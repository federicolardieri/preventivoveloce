'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function ConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = useRef(false);

  useEffect(() => {
    if (verified.current) return;
    verified.current = true;

    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const rawNext = searchParams.get('next') ?? '/welcome?type=register';
    const next = rawNext.startsWith('/') ? rawNext : '/welcome?type=register';

    if (!token_hash || !type) {
      router.replace('/login?error=auth_callback_failed');
      return;
    }

    const supabase = createClient();
    supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (error) {
        const isExpired = error.message?.toLowerCase().includes('expired');
        router.replace(`/login?error=${isExpired ? 'link_expired' : 'auth_callback_failed'}`);
      } else {
        router.replace(next);
      }
    });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#5c32e6] animate-spin" />
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#5c32e6] animate-spin" />
      </div>
    }>
      <ConfirmHandler />
    </Suspense>
  );
}
