"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationType =
  | "credits_low"
  | "credits_empty"
  | "quote_sent"
  | "quote_accepted"
  | "quote_opened";

interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  quote_id: string | null;
  created_at: string;
}

function hrefForNotification(n: NotificationRow): string {
  if (n.type === "credits_low" || n.type === "credits_empty") {
    return "/impostazioni";
  }
  if (n.quote_id) {
    return `/preventivi/${n.quote_id}`;
  }
  return "/preventivi";
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "ora";
  if (mins < 60) return `${mins} min fa`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h fa`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} g fa`;
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { notifications: NotificationRow[] };
      setNotifications(data.notifications ?? []);
    } catch {
      // ignora errori transitori di rete
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markOne = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifiche${unreadCount > 0 ? ` (${unreadCount} non lette)` : ""}`}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 hover:bg-primary/10 border border-white/30 text-muted-foreground hover:text-primary transition-all shadow-sm"
        >
          <Bell className="h-4.5 w-4.5 md:h-5 md:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow-md">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-bold">Notifiche</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Segna tutte lette
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              Nessuna notifica
            </p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={hrefForNotification(n)}
                onClick={() => {
                  if (!n.read) markOne(n.id);
                  setOpen(false);
                }}
                className={cn(
                  "block px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/60 transition-colors",
                  !n.read && "bg-primary/5",
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-bold leading-tight", n.read ? "text-foreground/70" : "text-foreground")}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 font-semibold">
                      {formatRelative(n.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
