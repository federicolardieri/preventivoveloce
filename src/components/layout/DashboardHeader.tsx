"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, MessageSquare, ChevronDown, User, Settings, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { DashboardUser } from "@/app/(dashboard)/layout";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: DashboardUser;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard Principale";
    if (pathname === "/nuovo") return "Crea Nuovo Preventivo";
    if (pathname.startsWith("/preventivi/")) return "Dettaglio Preventivo";
    if (pathname === "/preventivi") return "Storico Preventivi";
    if (pathname === "/preventivi/archivio") return "Archivio Preventivi";
    if (pathname === "/clienti") return "Rubrica Clienti";
    if (pathname === "/impostazioni") return "Impostazioni";
    return "";
  };

  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <header suppressHydrationWarning className="h-[60px] md:h-[80px] flex items-center justify-between px-4 pl-14 md:pl-8 md:px-8 sticky top-0 z-30 border-b border-primary/30 overflow-visible shadow-[0_10px_60px_-15px_rgba(92,50,230,0.3)] transition-all duration-300">

      {/* Premium Glass Layer */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[45px] backdrop-saturate-[200%] -z-10" />
      <div className="absolute inset-0 bg-primary/[0.03] -z-10" />

      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden -z-20 pointer-events-none">
        <motion.div
          animate={{ x: [0, 60, -30, 0], y: [0, -40, 50, 0], scale: [1, 1.3, 0.9, 1], rotate: [0, 45, -45, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-25%] left-[-5%] w-[450px] h-[450px] bg-primary/25 blur-[90px] rounded-full opacity-70"
        />
        <motion.div
          animate={{ x: [0, -50, 40, 0], y: [0, 60, -20, 0], scale: [1, 0.85, 1.15, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-35%] right-[5%] w-[400px] h-[400px] bg-primary/20 blur-[100px] rounded-full opacity-60"
        />
        <motion.div
          animate={{ x: [0, 30, -60, 0], y: [0, 50, -40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[5%] left-[35%] w-[250px] h-[250px] bg-primary/10 blur-[70px] rounded-full opacity-50"
        />
      </div>

      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none -z-10" />
      <div className="absolute inset-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-1px_3px_rgba(92,50,230,0.15)] pointer-events-none -z-10" />

      {/* Left: Page Title */}
      <div className="flex items-center relative z-10">
        <h2 className="text-lg md:text-2xl font-black bg-gradient-to-br from-primary via-primary to-purple-800 bg-clip-text text-transparent tracking-tighter drop-shadow-sm truncate">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 md:gap-6 relative z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="group rounded-xl relative bg-white/20 hover:bg-primary/10 border border-white/30 text-muted-foreground hover:text-primary transition-all shadow-sm">
            <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow-sm animate-pulse"></span>
          </Button>
          <Button variant="ghost" size="icon" className="group rounded-xl relative bg-white/20 hover:bg-primary/10 border border-white/30 text-muted-foreground hover:text-primary transition-all shadow-sm">
            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
          </Button>
        </div>

        <div className="hidden sm:block h-8 w-px bg-border"></div>

        {/* User Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 cursor-pointer group bg-white/30 backdrop-blur-md hover:bg-white/50 p-1.5 pr-4 rounded-full transition-all border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden relative border border-white/40 bg-white shadow-inner">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-primary/20 to-purple-300/30">
                  <span className="text-sm font-black text-primary">{initials}</span>
                </div>
              )}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-black bg-gradient-to-r from-primary to-purple-800 bg-clip-text text-transparent leading-tight tracking-tight">
                {user.fullName || user.email.split('@')[0]}
              </span>
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-tight">
                {user.plan}
              </span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-primary/40 group-hover:text-primary transition-all group-hover:translate-y-0.5", dropdownOpen && "rotate-180")} />
          </div>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-60 md:w-64 bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[24px] shadow-[0_20px_50px_-12px_rgba(92,50,230,0.25)] p-2 z-[100]"
              >
                <div className="p-4 border-b border-primary/5">
                  <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-1">Account</p>
                  <p className="text-sm font-black text-foreground truncate">{user.fullName || 'Utente'}</p>
                  <p className="text-[11px] text-muted-foreground font-medium truncate">{user.email}</p>
                </div>

                <div className="py-2">
                  <Link 
                    href="/impostazioni" 
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    Profilo
                  </Link>
                  <Link 
                    href="/impostazioni" 
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                    Impostazioni
                  </Link>
                </div>

                <div className="pt-2 border-t border-primary/5">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                      {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    </div>
                    Esci
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
