"use client";

import { useQuoteStore } from "@/store/quoteStore";
import { Quote, QuoteStatus } from "@/types/quote";
import { formatCurrency } from "@/lib/utils";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Copy, Eye, MoreHorizontal, Archive, Download, FileText, Search, Filter, AlertTriangle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DuplicateDialog } from "./DuplicateDialog";
import { SendQuoteDialog } from "@/components/quote/SendQuoteDialog";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: QuoteStatus; label: string; dot: string }[] = [
  { value: 'bozza',      label: 'Bozza',      dot: 'bg-amber-400' },
  { value: 'da_inviare', label: 'Da Inviare',  dot: 'bg-orange-400' },
  { value: 'inviato',    label: 'Inviato',     dot: 'bg-blue-400' },
  { value: 'accettato',  label: 'Accettato',   dot: 'bg-emerald-500' },
  { value: 'rifiutato',  label: 'Rifiutato',   dot: 'bg-red-500' },
  { value: 'scaduto',    label: 'Scaduto',     dot: 'bg-slate-400' },
];

const STATUS_PILLS: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all',        label: 'Tutti' },
  { value: 'bozza',      label: 'Bozze' },
  { value: 'da_inviare', label: 'Da Inviare' },
  { value: 'inviato',    label: 'In Attesa' },
  { value: 'accettato',  label: 'Accettati' },
  { value: 'rifiutato',  label: 'Rifiutati' },
  { value: 'scaduto',    label: 'Scaduti' },
];

interface QuotesTableProps {
  limit?: number;
  showFilters?: boolean;
}

function quoteTotal(quote: Quote): number {
  return quote.items.reduce((sum, item) => {
    const base = item.unitPrice * item.quantity;
    const disc = item.discountType === 'fixed' ? (item.discount || 0) : base * ((item.discount || 0) / 100);
    const sub = Math.max(0, base - disc);
    return sum + sub + sub * (item.vatRate / 100);
  }, 0);
}

function expiryDate(quote: Quote): Date {
  return new Date(new Date(quote.createdAt).getTime() + (quote.validityDays || 30) * 24 * 60 * 60 * 1000);
}

function isExpired(quote: Quote): boolean {
  if (['accettato', 'rifiutato', 'scaduto'].includes(quote.status)) return false;
  return expiryDate(quote) < new Date();
}

export function QuotesTable(props: QuotesTableProps) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse bg-muted/20 rounded-2xl" />}>
      <QuotesTableContent {...props} />
    </Suspense>
  );
}

function QuotesTableContent({ limit, showFilters }: QuotesTableProps) {
  const searchParams = useSearchParams();
  const { quotesList, archiveQuote, archiveInSupabase, duplicateQuote, changeStatus } = useQuoteStore();
  const router = useRouter();
  
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'sent') {
      setSendResult({ id: 'url', ok: true });
      // Clear URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('success');
      router.replace(`/preventivi${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
    } else if (success === 'saved') {
      setSaveResult(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('success');
      router.replace(`/preventivi${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
    }
  }, [searchParams, router]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingDuplicateId, setPendingDuplicateId] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [pendingSendQuote, setPendingSendQuote] = useState<Quote | null>(null);

  const pillCounts = STATUS_PILLS.reduce<Record<string, number>>((acc, p) => {
    acc[p.value] = p.value === 'all'
      ? quotesList.length
      : quotesList.filter(q => q.status === p.value).length;
    return acc;
  }, {});

  const filteredQuotes = quotesList.filter((quote) => {
    const searchString = searchQuery.toLowerCase();
    const matchesSearch =
      quote.number.toLowerCase().includes(searchString) ||
      (quote.client.name || "").toLowerCase().includes(searchString);
    if (!matchesSearch) return false;

    if (statusFilter !== 'all' && quote.status !== statusFilter) return false;

    if (dateFilter === "all") return true;
    const quoteDate = new Date(quote.createdAt);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dateFilter === "7days") return diffDays <= 7;
    if (dateFilter === "30days") return diffDays <= 30;
    if (dateFilter === "this_year") return quoteDate.getFullYear() === now.getFullYear();
    return true;
  });

  const sortedQuotes = [...filteredQuotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const displayQuotes = limit ? sortedQuotes.slice(0, limit) : sortedQuotes;

  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ id: string; ok: boolean } | null>(null);
  const [saveResult, setSaveResult] = useState<boolean>(false);

  const handleSend = async (quote: Quote, customMessage: string): Promise<boolean> => {
    if (!quote.client?.email) return false;
    setSendingId(quote.id);
    setSendResult(null);
    try {
      const res = await fetch('/api/email/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id, customMessage }),
      });
      if (res.ok) {
        changeStatus(quote.id, 'inviato');
      }
      setSendResult({ id: quote.id, ok: res.ok });
      return res.ok;
    } catch {
      setSendResult({ id: quote.id, ok: false });
      return false;
    } finally {
      setSendingId(null);
    }
  };

  const handleDownload = async (quote: Quote) => {
    try {
      setDownloadError(null);
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote),
      });
      if (res.status === 403) {
        const err = await res.json();
        setDownloadError(err.message ?? 'Limite raggiunto. Passa a un piano superiore.');
        return;
      }
      if (!res.ok) throw new Error('Errore generazione PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preventivo-${quote.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  if (displayQuotes.length === 0 && !searchQuery && statusFilter === 'all') {
    return (
      <div className="text-center py-20 px-6 rounded-3xl bg-muted/20 border-2 border-dashed border-border flex flex-col items-center justify-center transition-colors">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-sm">
          <FileText className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">Nessun preventivo</h3>
        <p className="text-muted-foreground mb-8 max-w-md font-medium leading-relaxed">
          Non hai ancora creato nessun preventivo. Inizia subito a generare nuove opportunità.
        </p>
        <Link href="/nuovo">
          <Button className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl shadow-lg shadow-primary/25 font-bold text-lg">
            Crea il tuo Primo Preventivo
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {downloadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-bold text-red-800">{downloadError}</p>
          </div>
          <a href="/impostazioni?tab=piano" className="text-sm text-red-600 underline font-bold whitespace-nowrap ml-4">
            Sblocca il piano →
          </a>
        </div>
      )}
      {sendResult && (
        <div className={`border rounded-xl p-4 flex items-center justify-between ${sendResult.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm font-bold ${sendResult.ok ? 'text-emerald-800' : 'text-red-800'}`}>
            {sendResult.ok ? 'Email inviata! Il cliente ha ricevuto il preventivo con il link di accettazione.' : 'Errore durante l\'invio. Riprova.'}
          </p>
          <button onClick={() => setSendResult(null)} className="ml-4 text-xs text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}
      {saveResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm font-bold text-emerald-800">
            Preventivo salvato correttamente nello storico!
          </p>
          <button onClick={() => setSaveResult(false)} className="ml-4 text-xs text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}
      {showFilters && (
        <>
          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_PILLS.map(pill => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                  statusFilter === pill.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {pill.label}
                {pillCounts[pill.value] > 0 && (
                  <span className={cn(
                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    statusFilter === pill.value ? "bg-white/25 text-white" : "bg-background text-muted-foreground border border-border"
                  )}>
                    {pillCounts[pill.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search + date filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca per numero preventivo o nome cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-11 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all text-foreground bg-background"
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 h-11 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm appearance-none bg-card text-foreground font-medium cursor-pointer"
              >
                <option value="all">Tutte le date</option>
                <option value="7days">Ultimi 7 giorni</option>
                <option value="30days">Ultimi 30 giorni</option>
                <option value="this_year">Quest&apos;anno</option>
              </select>
            </div>
          </div>
        </>
      )}

      {displayQuotes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nessun preventivo trovato</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden bg-card transition-colors shadow-sm">
          <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="font-bold text-card-foreground/70 h-12">Numero</TableHead>
                <TableHead className="font-bold text-card-foreground/70 h-12">Cliente</TableHead>
                <TableHead className="font-bold text-card-foreground/70 h-12">Data</TableHead>
                <TableHead className="font-bold text-card-foreground/70 h-12">Scadenza</TableHead>
                <TableHead className="font-bold text-card-foreground/70 h-12">Stato</TableHead>
                <TableHead className="text-right font-bold text-card-foreground/70 h-12">Importo</TableHead>
                <TableHead className="text-right font-bold text-card-foreground/70 h-12 w-[60px]">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayQuotes.map((quote) => {
                const total = quoteTotal(quote);
                const expiry = expiryDate(quote);
                const expired = isExpired(quote);

                return (
                  <TableRow key={quote.id} className="hover:bg-muted/20 border-border transition-colors group">
                    <TableCell className="font-bold text-card-foreground">{quote.number}</TableCell>
                    <TableCell>
                      <div className="font-bold text-card-foreground">{quote.client.name || "Senza nome"}</div>
                      {quote.client.email && <div className="text-xs text-muted-foreground">{quote.client.email}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">
                      {format(new Date(quote.createdAt), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "flex items-center gap-1.5 text-sm font-bold",
                        expired ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {expired && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
                        {format(expiry, "dd MMM yyyy", { locale: it })}
                      </div>
                      {expired && (
                        <div className="text-[11px] text-red-500/80 font-black uppercase tracking-tighter">Scaduto</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="text-right font-black text-card-foreground">
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Apri menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[175px]">
                          <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/preventivi/${quote.id}`} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Visualizza / Modifica</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="cursor-pointer">
                              <div className={`mr-2 h-2 w-2 rounded-full flex-shrink-0 ${STATUS_OPTIONS.find(s => s.value === quote.status)?.dot ?? 'bg-slate-400'}`} />
                              <span>Cambia Stato</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {STATUS_OPTIONS.map(({ value, label, dot }) => (
                                <DropdownMenuItem
                                  key={value}
                                  onClick={() => changeStatus(quote.id, value)}
                                  className={`cursor-pointer ${quote.status === value ? 'font-semibold' : ''}`}
                                >
                                  <div className={`mr-2 h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
                                  {label}
                                  {quote.status === value && <span className="ml-auto text-[#5c32e6]">✓</span>}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuItem onClick={() => handleDownload(quote)} className="cursor-pointer text-[#5c32e6] focus:text-[#5c32e6] focus:bg-indigo-50 font-medium">
                            <Download className="mr-2 h-4 w-4" />
                            <span>Scarica PDF</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setPendingSendQuote(quote);
                              setSendDialogOpen(true);
                            }}
                            disabled={!quote.client?.email || sendingId === quote.id}
                            className="cursor-pointer text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            <span>{sendingId === quote.id ? 'Invio…' : 'Invia al cliente'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setPendingDuplicateId(quote.id);
                              setDuplicateDialogOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Duplica</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={async () => {
                              archiveQuote(quote.id);
                              const supabase = createClient();
                              await archiveInSupabase(supabase, quote.id);
                            }}
                            className="cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            <span>Archivia</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      <DuplicateDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onConfirm={async () => {
          if (!pendingDuplicateId) return;
          await duplicateQuote(pendingDuplicateId);
          const newId = useQuoteStore.getState().currentQuote?.id;
          if (newId) router.push(`/preventivi/${newId}`);
          setPendingDuplicateId(null);
        }}
      />

      <SendQuoteDialog
        open={sendDialogOpen}
        onOpenChange={(v) => { setSendDialogOpen(v); if (!v) setPendingSendQuote(null); }}
        clientEmail={pendingSendQuote?.client?.email || ''}
        clientName={pendingSendQuote?.client?.name || ''}
        quoteNumber={pendingSendQuote?.number || ''}
        onConfirmSend={async (msg) => {
          if (!pendingSendQuote) return false;
          const ok = await handleSend(pendingSendQuote, msg);
          if (ok) {
            setSendDialogOpen(false);
            setPendingSendQuote(null);
          }
          return ok;
        }}
      />
    </div>
  );
}
