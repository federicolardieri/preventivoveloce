"use client";

import { useState } from "react";
import { useQuoteStore } from "@/store/quoteStore";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuotePreview } from "./QuotePreview";
import { QuoteStatusBadge } from "@/components/quotes-list/QuoteStatusBadge";
import { Download, ArrowLeft, Edit3, AlertCircle, Send, CheckCircle2, X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QuoteStatus } from "@/types/quote";
import { SendQuoteDialog } from "./SendQuoteDialog";
import { FollowUpDialog } from "./FollowUpDialog";

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: "bozza",      label: "Bozza" },
  { value: "da_inviare", label: "Da Inviare" },
  { value: "inviato",    label: "Inviato" },
  { value: "accettato",  label: "Accettato" },
  { value: "rifiutato",  label: "Rifiutato" },
  { value: "scaduto",    label: "Scaduto" },
];

export function QuoteViewer() {
  const { currentQuote, changeStatus } = useQuoteStore();
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);

  const handleSend = async (customMessage: string): Promise<boolean> => {
    if (!currentQuote?.id) return false;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/email/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: currentQuote.id, customMessage }),
      });
      setSendResult(res.ok ? 'success' : 'error');
      if (res.ok) router.push('/preventivi?success=sent');
      return res.ok;
    } catch {
      setSendResult('error');
      return false;
    } finally {
      setSending(false);
    }
  };

  if (!currentQuote) return null;

  const hasClientEmail = !!currentQuote.client?.email;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadError(null);
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentQuote),
      });
      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Preventivo-${currentQuote.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      setDownloadError('Errore durante la generazione del PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-[calc(100vh-76px)] w-full overflow-hidden bg-slate-50">
      <div className="w-full max-w-[1400px] mx-auto flex flex-col xl:flex-row h-full">

        {/* Colonna sinistra: documento */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 xl:p-10">

          {/* Breadcrumb + titolo */}
          <div className="flex items-center justify-between mb-4 md:mb-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Link href="/preventivi">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-800 gap-1.5 px-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Storico</span>
                </Button>
              </Link>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-mono font-semibold text-slate-700 text-sm md:text-base truncate">{currentQuote.number}</span>
              <QuoteStatusBadge status={currentQuote.status} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="gap-2 rounded-xl border-slate-200 font-semibold shrink-0"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{downloading ? "Generazione…" : "Scarica PDF"}</span>
            </Button>
          </div>

          {/* Send result banner */}
          {sendResult === 'success' && (
            <div className="max-w-4xl mx-auto mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm font-bold text-emerald-800">Email inviata! Il cliente ha ricevuto il preventivo con il link di accettazione.</p>
              </div>
              <button onClick={() => setSendResult(null)}><X className="w-4 h-4 text-emerald-400" /></button>
            </div>
          )}
          {sendResult === 'error' && (
            <div className="max-w-4xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm font-bold text-red-800">Errore durante l'invio. Verifica che l'email del cliente sia inserita e riprova.</p>
              </div>
              <button onClick={() => setSendResult(null)}><X className="w-4 h-4 text-red-400" /></button>
            </div>
          )}

          {/* Download error banner */}
          {downloadError && (
            <div className="max-w-4xl mx-auto mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-800">{downloadError}</p>
            </div>
          )}

          {/* Preview — mai bloccata per quote nello storico (già pagate con crediti) */}
          <div className="h-[60vh] xl:h-[calc(100vh-220px)] max-w-4xl mx-auto shadow-2xl rounded-2xl border border-slate-200 overflow-hidden bg-white">
            <QuotePreview mode="view" />
          </div>

          {/* Mobile action panel — stacked below preview */}
          <div className="xl:hidden max-w-4xl mx-auto mt-6 space-y-4 pb-6">
            {/* Info documento */}
            <div className="bg-white rounded-2xl p-4 md:p-5 space-y-3 border border-slate-200">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dettagli Preventivo</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between col-span-2 sm:col-span-1">
                  <span className="text-slate-500">Numero</span>
                  <span className="font-mono font-semibold text-slate-800">{currentQuote.number}</span>
                </div>
                <div className="flex justify-between col-span-2 sm:col-span-1">
                  <span className="text-slate-500">Cliente</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[150px] truncate">{currentQuote.client.name || '—'}</span>
                </div>
                <div className="flex justify-between col-span-2 sm:col-span-1">
                  <span className="text-slate-500">Validità</span>
                  <span className="font-semibold text-slate-800">{currentQuote.validityDays} giorni</span>
                </div>
                <div className="flex justify-between col-span-2 sm:col-span-1">
                  <span className="text-slate-500">Template</span>
                  <span className="font-semibold text-slate-800 capitalize">{currentQuote.template}</span>
                </div>
              </div>
            </div>

            {/* Selettore stato */}
            <div className="bg-white rounded-2xl p-4 md:p-5 space-y-2 border border-slate-200">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stato Preventivo</h2>
              <Select
                value={currentQuote.status}
                onValueChange={(v: string) => changeStatus(currentQuote.id, v as QuoteStatus)}
              >
                <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 font-semibold text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value} className="font-medium">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Azioni */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 h-12 rounded-xl bg-[#5c32e6] hover:bg-[#4b27cb] text-white font-bold shadow-lg shadow-indigo-500/20"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? "Generazione PDF…" : "Scarica PDF"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                onClick={() => router.push(`/nuovo?edit=${currentQuote.id}`)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Modifica
              </Button>
            </div>
            <Button
              onClick={() => setSendDialogOpen(true)}
              disabled={sending || !hasClientEmail}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
              title={!hasClientEmail ? 'Inserisci l\'email del cliente nel preventivo per abilitare l\'invio' : undefined}
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Invio in corso…' : hasClientEmail ? 'Invia al cliente' : 'Email cliente mancante'}
            </Button>
            <Button
              onClick={() => setFollowUpDialogOpen(true)}
              disabled={!hasClientEmail}
              variant="outline"
              className="w-full h-12 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 font-bold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              Follow-up
            </Button>
          </div>
        </div>

        {/* Colonna destra: pannello azioni — desktop only */}
        <div className="w-[340px] hidden xl:flex flex-col h-full bg-white border-l border-slate-200 p-7 gap-5">

          {/* Info documento */}
          <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dettagli Preventivo</h2>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Numero</span>
              <span className="font-mono font-semibold text-slate-800">{currentQuote.number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cliente</span>
              <span className="font-semibold text-slate-800 text-right max-w-[150px] truncate">{currentQuote.client.name || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Validità</span>
              <span className="font-semibold text-slate-800">{currentQuote.validityDays} giorni</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Template</span>
              <span className="font-semibold text-slate-800 capitalize">{currentQuote.template}</span>
            </div>
          </div>

          {/* Selettore stato */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stato Preventivo</h2>
            <Select
              value={currentQuote.status}
              onValueChange={(v: string) => changeStatus(currentQuote.id, v as QuoteStatus)}
            >
              <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 font-semibold text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value} className="font-medium">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              La modifica viene salvata immediatamente nello storico.
            </p>
          </div>

          {/* Azioni */}
          <div className="space-y-3 mt-auto">
            <Button
              onClick={() => setSendDialogOpen(true)}
              disabled={sending || !hasClientEmail}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasClientEmail ? 'Inserisci l\'email del cliente nel preventivo per abilitare l\'invio' : undefined}
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Invio in corso…' : hasClientEmail ? 'Invia al cliente' : 'Email cliente mancante'}
            </Button>

            <Button
              onClick={() => setFollowUpDialogOpen(true)}
              disabled={!hasClientEmail}
              variant="outline"
              className="w-full h-12 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 font-bold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasClientEmail ? 'Inserisci l\'email del cliente per abilitare il follow-up' : undefined}
            >
              <RefreshCw className="w-4 h-4" />
              Follow-up
            </Button>

            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full h-12 rounded-xl bg-[#5c32e6] hover:bg-[#4b27cb] text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "Generazione PDF…" : "Scarica PDF"}
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
              onClick={() => router.push(`/nuovo?edit=${currentQuote.id}`)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Modifica Preventivo
            </Button>

            <Button
              variant="ghost"
              className="w-full h-10 rounded-xl text-slate-500 hover:text-slate-800 font-medium text-sm"
              onClick={() => router.push('/preventivi')}
            >
              ← Torna allo storico
            </Button>
          </div>

        </div>
      </div>

      <SendQuoteDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        clientEmail={currentQuote.client?.email || ''}
        clientName={currentQuote.client?.name || ''}
        quoteNumber={currentQuote.number}
        onConfirmSend={handleSend}
      />
      {currentQuote && (
        <FollowUpDialog
          open={followUpDialogOpen}
          onOpenChange={setFollowUpDialogOpen}
          quoteId={currentQuote.id}
          clientEmail={currentQuote.client?.email || ''}
          clientName={currentQuote.client?.name || ''}
          quoteNumber={currentQuote.number}
          validityDays={currentQuote.validityDays || 30}
        />
      )}
    </div>
  );
}
