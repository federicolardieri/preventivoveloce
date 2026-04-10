"use client";

import { useQuoteStore } from "@/store/quoteStore";
import { QuotesTable } from "@/components/quotes-list/QuotesTable";
import { QuoteStatusBadge } from "@/components/quotes-list/QuoteStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, CheckCircle, Clock, Send, XCircle, PenLine,
  Plus, Copy, Download, Eye, Zap, ArrowRight
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Quote } from "@/types/quote";
import { useUIStore } from "@/store/uiStore";
import { Sparkles } from "lucide-react";
import { DuplicateDialog } from "@/components/quotes-list/DuplicateDialog";

function completionScore(quote: Quote): number {
  let score = 0;
  if (quote.client.name) score++;
  if (quote.sender.name) score++;
  if (quote.items.length > 0) score++;
  if (quote.items.some(i => i.description)) score++;
  if (quote.notes || quote.paymentTerms) score++;
  return Math.round((score / 5) * 100);
}

function quoteTotal(quote: Quote): number {
  return quote.items.reduce((sum, item) => {
    const base = item.unitPrice * item.quantity;
    const disc = item.discountType === 'fixed' ? (item.discount || 0) : base * ((item.discount || 0) / 100);
    const sub = Math.max(0, base - disc);
    return sum + sub + sub * (item.vatRate / 100);
  }, 0);
}

const STATUS_TIMELINE: Record<string, { color: string; dot: string }> = {
  bozza:      { color: 'text-amber-600',  dot: 'bg-amber-400' },
  da_inviare: { color: 'text-orange-600', dot: 'bg-orange-400' },
  inviato:    { color: 'text-blue-600',   dot: 'bg-blue-400' },
  accettato:  { color: 'text-emerald-600',dot: 'bg-emerald-500' },
  rifiutato:  { color: 'text-red-600',    dot: 'bg-red-500' },
  scaduto:    { color: 'text-slate-500',  dot: 'bg-slate-400' },
};

export default function DashboardHome() {
  const { quotesList, duplicateQuote } = useQuoteStore();
  const { setAiAssistantOpen } = useUIStore();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const total = quotesList.length;
  const accepted = quotesList.filter(q => q.status === 'accettato').length;
  const sent = quotesList.filter(q => q.status === 'inviato').length;
  const toSend = quotesList.filter(q => q.status === 'da_inviare').length;
  const drafts = quotesList.filter(q => q.status === 'bozza').length;
  const rejected = quotesList.filter(q => q.status === 'rifiutato').length;

  const totalRevenue = quotesList
    .filter(q => q.status === 'accettato')
    .reduce((sum, q) => sum + quoteTotal(q), 0);

  const sortedByDate = [...quotesList].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const lastQuote = sortedByDate[0] ?? null;
  const draftList = quotesList.filter(q => q.status === 'bozza').slice(0, 3);
  const timeline = sortedByDate.slice(0, 7);

  const handleDuplicateLast = () => {
    if (!lastQuote) return;
    setDuplicateDialogOpen(true);
  };

  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadLastPDF = async () => {
    if (!lastQuote || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastQuote),
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
      a.download = `preventivo-${lastQuote.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ } finally {
      setDownloading(false);
    }
  };

  const kpis = [
    { label: "Totale Preventivi", value: total, sub: "creati finora", icon: FileText, iconBg: "bg-indigo-50", iconColor: "text-indigo-600", valueColor: "text-card-foreground" },
    { label: "Fatturato Accettato", value: formatCurrency(totalRevenue), sub: `${accepted} accettati`, icon: CheckCircle, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-emerald-600" },
    { label: "In Attesa Risposta", value: sent, sub: "inviati al cliente", icon: Clock, iconBg: "bg-blue-50", iconColor: "text-blue-600", valueColor: "text-blue-600" },
    { label: "Da Inviare", value: toSend, sub: "pronti ma non inviati", icon: Send, iconBg: "bg-orange-50", iconColor: "text-orange-600", valueColor: "text-orange-500" },
    { label: "Bozze", value: drafts, sub: "non ancora completati", icon: PenLine, iconBg: "bg-amber-50", iconColor: "text-amber-600", valueColor: "text-amber-500" },
    { label: "Rifiutati", value: rejected, sub: "non andati a buon fine", icon: XCircle, iconBg: "bg-red-50", iconColor: "text-red-500", valueColor: "text-red-500" },
  ];

  const quickActions = [
    { label: "Nuovo Preventivo", icon: Plus, color: "bg-[#5c32e6] text-white hover:bg-[#4b27cb] shadow-indigo-200", action: () => router.push('/nuovo') },
    { label: "Duplica Ultimo", icon: Copy, color: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200", action: handleDuplicateLast, disabled: !lastQuote },
    { label: "Scarica Ultimo PDF", icon: Download, color: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200", action: handleDownloadLastPDF, disabled: !lastQuote || downloading },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Welcome Banner */}
      <div className="bg-[#5c32e6] rounded-2xl p-6 md:px-10 md:py-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-3xl -ml-10 -mb-10" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Smetti di compilare, inizia a vendere 🚀</h1>
            <p className="text-white/80 text-sm md:text-lg max-w-xl leading-relaxed">
              Scrivi cosa ti serve e l'Agente AI genererà il tuo preventivo <strong className="text-white">in meno di 20 secondi</strong>. Senza errori, senza fatica.
            </p>
          </div>
          <Button 
            onClick={() => { setAiAssistantOpen(true); router.push('/nuovo'); }}
            className="bg-white text-[#5c32e6] hover:bg-slate-50 font-black rounded-2xl px-8 h-14 shadow-2xl flex-shrink-0 text-lg gap-2 transition-transform hover:-translate-y-1"
          >
            <Sparkles className="w-5 h-5" />
            ✨ Genera con AI
          </Button>
        </div>
      </div>

      {/* Quota error banner */}
      {downloadError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-bold text-red-800">{downloadError}</p>
          </div>
          <a href="/impostazioni?tab=piano" className="text-sm text-red-600 underline font-bold whitespace-nowrap ml-4">
            Sblocca il piano →
          </a>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-border dark:border-white/5 shadow-sm rounded-2xl bg-card overflow-hidden group hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center gap-3 pb-2 pt-5 px-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${kpi.iconBg} dark:bg-white`}>
                  <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                </div>
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-tight">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5 px-5">
                <div className={`text-3xl font-black tracking-tight ${kpi.valueColor}`}>{kpi.value}</div>
                <p className="text-xs font-medium text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Azioni Rapide */}
      <div className="bg-card rounded-3xl p-5 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">Azioni Rapide</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.action}
                disabled={action.disabled}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 shadow-sm",
                  action.color.includes('bg-white') 
                    ? "bg-white dark:bg-white border border-border dark:border-border text-card-foreground hover:bg-slate-50" 
                    : action.color
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-left leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main grid: contenuto principale + sidebar destra */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonna principale (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bozze da completare */}
          {draftList.length > 0 && (
            <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-border dark:border-white/5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h2 className="text-base font-bold text-card-foreground">Bozze da completare</h2>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{draftList.length}</span>
                </div>
                <Link href="/preventivi">
                  <button className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1">
                    Vedi tutte <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
              <div className="space-y-3">
                {draftList.map(q => {
                  const score = completionScore(q);
                  const total = quoteTotal(q);
                  return (
                    <Link key={q.id} href={`/preventivi/${q.id}`}>
                      <div className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary/20 hover:bg-primary/5 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                          <PenLine className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-card-foreground">{q.number}</span>
                            {q.client.name && <span className="text-xs text-muted-foreground truncate">— {q.client.name}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[120px]">
                              <div
                                className="h-1.5 rounded-full bg-amber-400 transition-all"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground font-medium">{score}% completato</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-card-foreground">{formatCurrency(total)}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(q.createdAt), 'dd MMM', { locale: it })}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ultimi preventivi */}
          <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-border">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground border-b-2 border-primary pb-1 inline-block">
                Ultimi Preventivi
              </h2>
              <Link href="/preventivi">
                <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-sm font-semibold rounded-xl h-8">
                  Vedi tutti →
                </Button>
              </Link>
            </div>
            <QuotesTable limit={5} />
          </div>
        </div>

        {/* Sidebar destra (1/3) */}
        <div className="space-y-6">

          {/* AI Virtual Agent Prominence Card */}
          <div className="bg-gradient-to-br from-[#5c32e6] to-[#7c3aed] rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-inner">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-black leading-tight mb-3">
                Crea il tuo preventivo in meno di 20 secondi con il nostro agente AI
              </h3>
              <p className="text-white/70 text-sm mb-6 font-medium leading-relaxed">
                Descrivi il tuo progetto a voce o via chat e lascia che la nostra intelligenza artificiale faccia il lavoro duro per te.
              </p>
              <Link href="/nuovo">
                <Button 
                  onClick={() => setAiAssistantOpen(true)}
                  className="w-full bg-white text-[#5c32e6] hover:bg-slate-50 font-black rounded-xl h-11 shadow-lg flex items-center justify-center gap-2 group-hover:translate-y-[-2px] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Inizia ora
                </Button>
              </Link>
            </div>
          </div>

          {/* Preview ultimo preventivo */}
          {lastQuote ? (
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-50 overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: lastQuote.theme?.primaryColor ?? '#5c32e6' }}
              />
              <div className="p-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ultimo Preventivo</p>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 leading-tight">{lastQuote.number}</h3>
                    <p className="text-sm text-slate-500 truncate">{lastQuote.client.name || 'Senza nome'}</p>
                  </div>
                  <QuoteStatusBadge status={lastQuote.status} />
                </div>
                <div className="text-2xl font-black text-slate-900 mb-1">
                  {formatCurrency(quoteTotal(lastQuote))}
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  {format(new Date(lastQuote.createdAt), "dd MMMM yyyy", { locale: it })}
                </p>
                <div className="flex gap-2">
                  <Link href={`/preventivi/${lastQuote.id}`} className="flex-1">
                    <Button size="sm" className="w-full bg-[#5c32e6] hover:bg-[#4b27cb] rounded-xl text-xs font-bold">
                      <Eye className="w-3 h-3 mr-1.5" /> Apri
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={handleDownloadLastPDF} disabled={downloading} className="rounded-xl text-xs font-bold border-slate-200">
                    <Download className="w-3 h-3 mr-1.5" />
                    {downloading ? '...' : 'PDF'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center text-center py-10">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Nessun preventivo ancora</p>
              <Link href="/nuovo" className="mt-3">
                <Button size="sm" className="bg-[#5c32e6] rounded-xl text-xs font-bold">
                  <Plus className="w-3 h-3 mr-1" /> Crea il primo
                </Button>
              </Link>
            </div>
          )}

          {/* Timeline attività */}
          <div className="bg-card rounded-3xl p-5 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-border dark:border-white/5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Attività Recente</p>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nessuna attività</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((q, i) => {
                  const cfg = STATUS_TIMELINE[q.status] ?? STATUS_TIMELINE.bozza;
                  return (
                    <Link key={q.id} href={`/preventivi/${q.id}`}>
                      <div className="flex items-start gap-3 group">
                        <div className="flex flex-col items-center flex-shrink-0 mt-1">
                          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-[16px]" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-bold text-card-foreground group-hover:text-primary transition-colors">{q.number}</span>
                            <span className={`text-[11px] font-semibold ${cfg.color}`}>{q.status.replace('_', ' ')}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {q.client.name || 'Senza nome'} · {formatDistanceToNow(new Date(q.updatedAt), { locale: it, addSuffix: true })}
                          </div>
                        </div>
                        <Zap className="w-3 h-3 text-muted-foreground/20 group-hover:text-primary/40 flex-shrink-0 mt-1 transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

    <DuplicateDialog
      open={duplicateDialogOpen}
      onOpenChange={setDuplicateDialogOpen}
      onConfirm={async () => {
        if (!lastQuote) return;
        await duplicateQuote(lastQuote.id);
        const newId = useQuoteStore.getState().currentQuote?.id;
        if (newId) router.push(`/preventivi/${newId}`);
      }}
    />
    </div>
  );
}
