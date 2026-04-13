"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuoteStore } from "@/store/quoteStore";
import { useUIStore } from "@/store/uiStore";
import { createClient } from "@/lib/supabase/client";

import {
  FileText,
  LayoutDashboard,
  Settings,
  Plus,
  Zap,
  Sparkles,
  LogOut,
  UserRound,
  Archive,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { DashboardUser } from "@/app/(dashboard)/layout";

const PAID_PLANS_ENABLED = process.env.NEXT_PUBLIC_PAID_PLANS_ENABLED === 'true';

interface SidebarProps {
  user: DashboardUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { quotesList } = useQuoteStore();
  const { setAiAssistantOpen } = useUIStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const now = new Date();
  const thisMonth = quotesList.filter(q => {
    const d = new Date(q.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const accepted = quotesList.filter(q => q.status === 'accettato').length;
  const pending  = quotesList.filter(q => q.status === 'inviato').length;

  const isPro = user.plan === 'pro';
  const creditsUsed = user.creditsTotal !== null && user.creditsRemaining !== null
    ? user.creditsTotal - user.creditsRemaining
    : 0;
  const usagePercent = isPro || user.creditsTotal === null
    ? 0
    : Math.min(100, (creditsUsed / user.creditsTotal) * 100);
  const isNearLimit = usagePercent >= 80;

  const planLabel = user.plan === 'pro' ? 'Pro' : user.plan === 'starter' ? 'Starter' : 'Free';

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Preventivi",
      icon: FileText,
      href: "/preventivi",
      active: pathname === "/preventivi" || pathname.startsWith("/preventivi/"),
    },
    {
      label: "Archivio",
      icon: Archive,
      href: "/preventivi/archivio",
      active: pathname === "/preventivi/archivio",
    },
    {
      label: "Clienti",
      icon: UserRound,
      href: "/clienti",
      active: pathname === "/clienti",
    },
  ];

  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' });
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full w-full md:w-64 shadow-2xl z-20 relative bg-sidebar text-sidebar-foreground transition-colors duration-300 overflow-y-auto">
      {/* Logo Section */}
      <div className="relative px-5 pt-6 pb-5 border-b border-sidebar-foreground/10 flex justify-center">
        <Link href="/dashboard" className="group">
          <div className="w-52 h-32 rounded-[32px] bg-white flex items-center justify-center shadow-xl border border-transparent overflow-hidden transition-all group-hover:scale-105 group-active:scale-95">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Logo"
              className="w-44 h-24 object-contain"
            />
          </div>
        </Link>

      </div>

      {/* Primary Action Button */}
      <div className="p-6 pb-2">
        <Link href="/nuovo" className="block w-full">
          <Button className="w-full justify-center gap-2 h-12 bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 font-bold shadow-lg shadow-black/10 rounded-xl transition-all hover:-translate-y-0.5" size="lg">
            <Plus className="h-5 w-5" />
            Nuovo Preventivo
          </Button>
        </Link>
      </div>

      {/* AI Agent CTA Card */}
      <div className="px-4 pb-2">
        <div className="relative bg-sidebar-foreground/10 rounded-3xl p-5 border border-sidebar-foreground/20 overflow-hidden group/ai">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mt-10 group-hover/ai:opacity-10 transition-opacity" />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover/ai:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-sidebar-foreground leading-snug mb-3 text-left">
              Smetti di compilare manualmenta. L'AI crea tutto per te.
            </p>
            <Button
              onClick={() => { router.push('/nuovo'); setAiAssistantOpen(true); }}
              className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 font-black text-[11px] h-11 md:h-9 rounded-xl shadow-lg border-b-2 border-black/10 uppercase tracking-wider"
            >
              Genera con AI ✨
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 pt-4 pb-4">
        <p className="px-4 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest mb-4">Menu Principale</p>
        <div className="space-y-1.5">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all group relative overflow-hidden",
                route.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5"
              )}
            >
              <route.icon className={cn("h-5 w-5 transition-colors z-10", route.active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} />
              <span className="z-10">{route.label}</span>
              {route.active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-sidebar-accent-foreground rounded-r-full" />
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Mini Statistiche */}
      <div className="px-2 pb-4 flex-1 flex flex-col justify-end">
        <p className="px-3 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest mb-2">Statistiche</p>
        <div className="bg-sidebar-foreground/10 rounded-2xl p-2 space-y-0.5">
          <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-sidebar-foreground/5 transition-colors">
            <div className="flex items-center gap-2.5">
              <FileText className="w-3.5 h-3.5 text-sidebar-foreground/40" />
              <span className="text-[11px] font-bold text-sidebar-foreground/60">Questo mese</span>
            </div>
            <span className="text-sm font-black text-sidebar-foreground">{thisMonth}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-sidebar-foreground/5 transition-colors">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold text-sidebar-foreground/60">Accettati</span>
            </div>
            <span className="text-sm font-black text-emerald-300">{accepted}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-sidebar-foreground/5 transition-colors">
            <div className="flex items-center gap-2.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold text-sidebar-foreground/60">In attesa</span>
            </div>
            <span className="text-sm font-black text-blue-300">{pending}</span>
          </div>
        </div>
      </div>

      {/* Piano / Utilizzo */}
      <div className="px-2 pb-3">
        <div className="bg-black/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest">Il tuo piano</span>
            <span className="flex items-center gap-1 bg-sidebar-foreground/15 text-sidebar-foreground text-[10px] font-black px-2 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" />
              {planLabel}
            </span>
          </div>
          {!isPro && user.creditsTotal !== null && (
            <>
              <div className="w-full bg-sidebar-foreground/20 rounded-full h-1.5 mb-2">
                <div
                  className={cn("h-1.5 rounded-full transition-all", isNearLimit ? "bg-rose-400" : "bg-sidebar-foreground")}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-sidebar-foreground/60 font-bold">
                  {user.creditsRemaining ?? 0} / {user.creditsTotal} crediti
                </span>
                {PAID_PLANS_ENABLED && (
                  <Link href="/impostazioni" className="text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors font-black">
                    Upgrade →
                  </Link>
                )}
              </div>
            </>
          )}
          {isPro && (
            <p className="text-[11px] text-sidebar-foreground/60 font-bold">Preventivi illimitati</p>
          )}
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 mt-auto border-t border-sidebar-foreground/10">
        <p className="px-4 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest mb-3">Account</p>
        <div className="bg-sidebar-foreground/5 rounded-2xl border border-sidebar-foreground/10 overflow-hidden p-3 pt-4">
          <div className="flex flex-col gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-sidebar-foreground/10 flex items-center justify-center shrink-0 border border-sidebar-foreground/20 overflow-hidden shadow-md">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-black text-sidebar-foreground">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-sidebar-foreground leading-tight whitespace-nowrap overflow-visible">
                {user.fullName || 'Utente'}
              </p>
              <p className="text-[11px] text-sidebar-foreground/60 font-bold tracking-tight whitespace-nowrap overflow-visible">
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-sidebar-foreground/10 mx-[-4px]">
            <Link
              href="/impostazioni"
              className={cn(
                "flex items-center gap-2 px-3 py-3 md:py-2 min-h-[44px] md:min-h-0 rounded-lg transition-all text-[11px] font-black uppercase tracking-wider group/set",
                pathname === "/impostazioni" ? "text-sidebar-foreground bg-sidebar-foreground/10" : "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5"
              )}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Impostazioni</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-3 py-3 md:py-2 min-h-[44px] md:min-h-0 rounded-lg transition-all text-[11px] font-black uppercase tracking-wider text-sidebar-foreground/40 hover:text-rose-400 hover:bg-rose-400/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Esci</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
