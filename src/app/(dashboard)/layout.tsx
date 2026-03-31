import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { QuoteLoader } from '@/components/layout/QuoteLoader';
import { MobileNav } from '@/components/layout/MobileNav';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export interface DashboardUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  phoneNumber: string;
  plan: 'free' | 'starter' | 'pro';
  creditsRemaining: number | null;
  creditsTotal: number | null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let dashboardUser: DashboardUser = {
    id: user?.id ?? '',
    email: user?.email ?? '',
    fullName: user?.user_metadata?.full_name ?? '',
    avatarUrl: user?.user_metadata?.avatar_url ?? '',
    phoneNumber: user?.user_metadata?.phone_number ?? '',
    plan: 'free',
    creditsRemaining: 0,
    creditsTotal: 1,
  };

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, full_name, avatar_url, phone_number, credits_remaining')
      .eq('id', user.id)
      .single();

    if (profile) {
      const plan = (profile.plan ?? 'free') as DashboardUser['plan'];
      const PLAN_CREDITS: Record<string, number | null> = { free: 1, starter: 10, pro: null };
      dashboardUser = {
        ...dashboardUser,
        fullName: profile.full_name ?? dashboardUser.fullName,
        avatarUrl: profile.avatar_url ?? dashboardUser.avatarUrl,
        phoneNumber: profile.phone_number ?? dashboardUser.phoneNumber,
        plan,
        creditsRemaining: plan === 'pro' ? null : (profile.credits_remaining ?? 0),
        creditsTotal: PLAN_CREDITS[plan] ?? 1,
      };
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 w-full">
      <QuoteLoader plan={dashboardUser.plan} />
      <MobileNav user={dashboardUser} />
      <div className="hidden md:block">
        <Sidebar user={dashboardUser} />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader user={dashboardUser} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
