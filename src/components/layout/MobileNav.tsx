"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { DashboardUser } from "@/app/(dashboard)/layout";

interface MobileNavProps {
  user: DashboardUser;
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Chiudi la sidebar quando si cambia pagina
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Blocca scroll del body quando la sidebar è aperta
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button — visibile solo su mobile, nascosto quando sidebar è aperta */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="md:hidden fixed top-[10px] left-3 z-50 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30"
          aria-label="Apri menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto bg-sidebar">
          <Sidebar user={user} />
        </div>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-3 z-10 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/25 transition-colors"
          aria-label="Chiudi menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
