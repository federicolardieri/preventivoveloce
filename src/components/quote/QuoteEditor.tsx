"use client";

import { useState, useEffect } from "react";
import { useQuoteStore } from "@/store/quoteStore";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/store/uiStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Download,
  Save,
  Sparkles,
  Coins,
  FileText,
  Zap,
  Lock,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRO_TEMPLATES } from "@/types/quote";

// Sub-components
import { SenderForm } from "./SenderForm";
import { ClientForm } from "./ClientForm";
import { LineItemsTable } from "./LineItemsTable";
import { TemplateSelector } from "./TemplateSelector";
import { LogoUpload } from "./LogoUpload";
import { QuotePreview } from "./QuotePreview";
import { AttachmentsManager } from "./AttachmentsManager";
import { AIAssistant } from "./AIAssistant";
import { SendQuoteDialog } from "./SendQuoteDialog";

export function QuoteEditor() {
  const { currentQuote, updateDetails, saveQuote, saveToSupabase, changeStatus } = useQuoteStore();
  const isProPlan = useQuoteStore(state => state.isProPlan);
  const { setAiAssistantOpen } = useUIStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dati");
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [noCreditsEdit, setNoCreditsEdit] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const isNewQuote = currentQuote?.items.length === 0 && !currentQuote?.client.name;

  // Auto-open AI for new quotes ONLY when it becomes a new quote
  useEffect(() => {
    if (isNewQuote) {
      setAiAssistantOpen(true);
    }
  }, [isNewQuote]); // eslint-disable-line react-hooks/exhaustive-deps

  // Controlla quota al mount per bloccare preview e download se limite esaurito
  // Se la quote esiste già nel DB, segna savedToDb = true (evita duplicati)
  useEffect(() => {
    if (!currentQuote?.id) return;
    fetch(`/api/quota?quoteId=${currentQuote.id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.allowed) setQuotaBlocked(true);
        if (data.isExistingQuote) {
          setSavedToDb(true);
          // Quota esaurita ma la quote esiste già: blocca modifica/preview/salvataggio
          if (data.creditsRemaining !== null && data.creditsRemaining <= 0) {
            setNoCreditsEdit(true);
          }
        }
      })
      .catch(() => {});
  }, [currentQuote?.id]);

  if (!currentQuote) return null;

  const isProTemplate = PRO_TEMPLATES.includes(currentQuote.template);
  const isLocked = isProTemplate && !isProPlan;

  // Salva su Supabase (upsert). Controlla la quota SOLO per quote nuove (primo INSERT).
  // Quote già salvate → UPDATE senza consumare crediti (trigger DB solo su INSERT).
  const persistToSupabase = async (): Promise<boolean> => {
    if (!currentQuote) return false;

    // Cattura la quote PRIMA di qualsiasi await per evitare la race condition:
    // saveQuote() → quotesList.length++ → useEffect ri-gira → currentQuote reset vuoto
    // → saveToSupabase salverebbe dati vuoti nel DB.
    const snapshot = useQuoteStore.getState().currentQuote;
    if (!snapshot) return false;

    if (!savedToDb) {
      // Prima volta: controlla crediti
      const quotaRes = await fetch(`/api/quota?quoteId=${snapshot.id}`);
      const quota = await quotaRes.json();
      if (!quota.allowed) {
        setQuotaError(quota.message ?? 'Limite raggiunto. Passa a un piano superiore.');
        setQuotaBlocked(true);
        return false;
      }
    }
    // Salva sempre (INSERT la prima volta, UPDATE le successive)
    try { saveQuote(); } catch { /* localStorage pieno — non blocca */ }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await saveToSupabase(supabase, user.id, snapshot);
    setSavedToDb(true);
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const wasFirstSave = !savedToDb;
      const ok = await persistToSupabase();
      if (ok) {
        if (wasFirstSave) router.refresh();
        router.push("/preventivi?success=saved");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSendToClient = async (customMessage: string): Promise<boolean> => {
    if (!currentQuote) return false;
    setSending(true);
    setSendError(null);
    try {
      const wasFirstSave = !savedToDb;
      const ok = await persistToSupabase();
      if (!ok) return false;
      if (wasFirstSave) router.refresh();
      const res = await fetch('/api/email/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: useQuoteStore.getState().currentQuote?.id ?? currentQuote.id, customMessage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSendError(body.error ?? 'Errore invio email');
        return false;
      }
      // Aggiorna lo stato locale a 'inviato' prima del redirect
      const quoteId = useQuoteStore.getState().currentQuote?.id ?? currentQuote.id;
      changeStatus(quoteId, 'inviato');
      router.push('/preventivi?success=sent');
      return true;
    } catch {
      setSendError('Errore di rete. Riprova.');
      return false;
    } finally {
      setSending(false);
    }
  };

  const getStepNumber = () => {
    if (activeTab === "dati") return "1";
    if (activeTab === "voci") return "2";
    if (activeTab === "fine") return "3";
    return "1";
  };

  const handleDownloadPDF = async () => {
    if (!currentQuote) return;
    setQuotaError(null);
    setDownloading(true);
    try {
      // 1. Salva su Supabase (consuma credito via trigger INSERT la prima volta)
      const wasFirstSave = !savedToDb;
      const ok = await persistToSupabase();
      if (!ok) return;
      if (wasFirstSave) router.refresh();

      // 2. Genera PDF
      const snapshot = useQuoteStore.getState().currentQuote ?? currentQuote;
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });

      if (!res.ok) throw new Error('Failed to generate PDF');

      // 3. Download del blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Preventivo-${snapshot.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 4. Reindirizza allo storico — impedisce ri-download gratuiti di versioni
      //    modificate dello stesso preventivo senza consumare un nuovo credito.
      router.push('/preventivi');
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const calculateSubtotal = () => {
    return currentQuote.items.reduce((acc, item) => {
      const lineBase = item.quantity * item.unitPrice;
      const discountVal = item.discountType === 'fixed' ? (item.discount || 0) : lineBase * ((item.discount || 0) / 100);
      return acc + Math.max(0, lineBase - discountVal);
    }, 0);
  };
  
  const calculateTax = () => {
    return currentQuote.items.reduce((acc, item) => {
      const lineBase = item.quantity * item.unitPrice;
      const discountVal = item.discountType === 'fixed' ? (item.discount || 0) : lineBase * ((item.discount || 0) / 100);
      const taxable = Math.max(0, lineBase - discountVal);
      return acc + (taxable * (item.vatRate / 100));
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(
      currentQuote.currency === "USD" ? "en-US" : 
      currentQuote.currency === "GBP" ? "en-GB" : "it-IT", 
      { style: "currency", currency: currentQuote.currency }
    ).format(val / 100);
  };

  return (
    <>
    <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)] md:h-[calc(100vh-76px)] w-full overflow-hidden bg-background relative transition-colors">
      <div className="flex flex-col lg:flex-row w-full h-full max-w-[1600px] mx-auto relative">

        {/* Main Editor Area (Left Pane) */}
        <div className={`w-full lg:w-[40%] flex flex-col h-full overflow-y-auto custom-scrollbar px-4 md:px-6 lg:px-10 py-6 md:py-10 transition-all ${isLocked || noCreditsEdit ? 'blur-sm pointer-events-none opacity-60' : ''}`}>
          
          <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <Link href="/preventivi">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-semibold gap-2 border border-transparent hover:border-border transition-all">
                  <ArrowLeft className="w-4 h-4" />
                  Torna allo Storico
                </Button>
              </Link>
              <div className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                Step {getStepNumber()} di 3
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground mb-2">Configura Preventivo</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">N° Documento</span>
                  <Input
                    value={currentQuote.number}
                    onChange={(e) => updateDetails({ number: e.target.value })}
                    className="border-0 p-0 h-auto font-mono font-bold text-[#5c32e6] text-sm focus-visible:ring-0 bg-transparent w-32"
                  />
                </div>
              </div>
            </div>
            {/* AI Magic Banner - Simplified trigger for Virtual Assistant */}
            <div className="bg-gradient-to-r from-[#5c32e6] to-[#7c3aed] rounded-2xl md:rounded-[32px] p-5 md:p-10 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group mb-8 md:mb-12 animate-in fade-in slide-in-from-top-6 duration-700">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
                <div className="flex items-start gap-3 md:gap-6">
                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner flex-shrink-0">
                    <Sparkles className="w-5 h-5 md:w-9 md:h-9 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-3xl font-black leading-tight mb-1 md:mb-2">Genera in meno di 20 secondi ✨</h3>
                    <p className="text-white/80 text-sm md:text-lg font-medium max-w-xl">
                      Usa il nostro Agente Virtuale per compilare tutto automaticamente parlando o scrivendo in chat.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setAiAssistantOpen(true)}
                  className="bg-white text-[#5c32e6] hover:bg-slate-50 font-black rounded-2xl h-11 md:h-16 px-6 md:px-10 text-base md:text-xl shadow-lg flex items-center gap-3 transition-all hover:scale-[1.05] flex-shrink-0"
                >
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                  Inizia ora
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Modern Pill Tabs Navigation (cmotive style) */}
              <div className="bg-card p-1.5 md:p-2 rounded-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border mb-6 md:mb-10 inline-flex w-full md:w-auto transition-colors">
                <TabsList className="flex w-full justify-start gap-1 md:gap-2 bg-transparent p-0 h-10 md:h-12 rounded-full">
                  <TabsTrigger
                    value="dati"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-full px-3 md:px-6 h-full uppercase tracking-wider font-bold text-[10px] md:text-[11px] text-card-foreground/60 data-[state=active]:text-primary-foreground transition-all flex-1 md:flex-initial"
                  >
                    DATI
                  </TabsTrigger>
                  <TabsTrigger
                    value="voci"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-full px-3 md:px-6 h-full uppercase tracking-wider font-bold text-[10px] md:text-[11px] text-card-foreground/60 data-[state=active]:text-primary-foreground transition-all flex-1 md:flex-initial"
                  >
                    VOCI
                  </TabsTrigger>
                  <TabsTrigger
                    value="fine"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-full px-3 md:px-6 h-full uppercase tracking-wider font-bold text-[10px] md:text-[11px] text-card-foreground/60 data-[state=active]:text-primary-foreground transition-all flex-1 md:flex-initial"
                  >
                    RIEPILOGO
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="dati" className="space-y-6 md:space-y-10 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-card rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(92,50,230,0.08)] transition-all duration-300">
                  <h3 className="text-xl font-bold text-card-foreground mb-6">Logo Aziendale</h3>
                  <LogoUpload />
                </div>
                <SenderForm />
                <ClientForm />
                
                <div className="bg-card rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(92,50,230,0.08)] transition-all duration-300">
                  <h3 className="text-xl font-bold text-card-foreground mb-6">Termini e Condizioni</h3>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-muted-foreground">Note Generali</Label>
                      <Textarea 
                        id="notes" 
                        value={currentQuote.notes} 
                        onChange={(e) => updateDetails({ notes: e.target.value })}
                        placeholder="Es. Il presente preventivo è valido per 30 giorni..."
                        className="resize-none h-32 bg-background border-border focus-visible:ring-primary/20 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="paymentTerms" className="text-muted-foreground font-semibold">Termini di Pagamento</Label>
                        <Input
                          id="paymentTerms"
                          value={currentQuote.paymentTerms}
                          onChange={(e) => updateDetails({ paymentTerms: e.target.value })}
                          placeholder="e.g. Net 30"
                          className="bg-background border-border rounded-xl h-11 focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="validityDays" className="text-muted-foreground font-semibold">Validità (Giorni)</Label>
                        <Input
                          id="validityDays"
                          type="number"
                          min="1"
                          value={currentQuote.validityDays}
                          onChange={(e) => updateDetails({ validityDays: parseInt(e.target.value) || 30 })}
                          className="bg-background border-border rounded-xl h-11 focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* IBAN opzionale */}
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => updateDetails({ iban: currentQuote.iban !== undefined ? undefined : '' })}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${currentQuote.iban !== undefined ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${currentQuote.iban !== undefined ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                        <Label className="text-muted-foreground font-semibold cursor-pointer" onClick={() => updateDetails({ iban: currentQuote.iban !== undefined ? undefined : '' })}>
                          Mostra IBAN nel documento
                        </Label>
                      </div>
                      {currentQuote.iban !== undefined && (
                        <Input
                          value={currentQuote.iban}
                          onChange={(e) => updateDetails({ iban: e.target.value })}
                          placeholder="IT60 X054 2811 1010 0000 0123 456"
                          className="bg-background border-border rounded-xl h-11 focus-visible:ring-primary/20 font-mono"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="voci" className="space-y-6 md:space-y-8 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-card rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(92,50,230,0.08)] transition-all duration-300">
                   <h3 className="text-xl font-bold text-foreground mb-6">Voci Preventivo</h3>
                   <LineItemsTable />
                </div>
              </TabsContent>


              <TabsContent value="fine" className="space-y-6 md:space-y-8 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AttachmentsManager />

                <div className="bg-card rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_-4px_rgba(92,50,230,0.08)] transition-all duration-300">
                  <div className="flex justify-between items-center mb-8 border-b border-border pb-6">
                    <h3 className="text-xl font-black text-primary">Riepilogo e Salvataggio</h3>
                    <Select value={currentQuote.currency} onValueChange={(val: 'EUR' | 'USD' | 'GBP' | 'CHF') => updateDetails({ currency: val })}>
                      <SelectTrigger className="w-24 h-8 bg-primary/10 text-primary font-bold border-0 text-xs rounded-lg">
                        <Coins className="w-3 h-3 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CHF">CHF (₣)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4 mb-10 bg-muted/30 p-6 rounded-2xl">
                    <div className="flex justify-between items-baseline pb-4 border-b border-border">
                      <span className="font-semibold text-muted-foreground">Imponibile</span>
                      <span className="font-bold text-card-foreground text-lg">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between items-baseline pb-4 border-b border-border">
                      <span className="font-semibold text-muted-foreground">IVA (Totale)</span>
                      <span className="font-bold text-card-foreground text-lg">{formatCurrency(calculateTax())}</span>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Totale Documento</p>
                      <div className="flex items-end justify-between">
                        <span className="text-3xl md:text-5xl font-black text-card-foreground tracking-tighter shrink-0">{formatCurrency(calculateTotal())}</span>
                        <span className="bg-emerald-100 dark:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-md shadow-sm">INC. IVA</span>
                      </div>
                    </div>
                  </div>

                  {isProTemplate && (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-1">
                      <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">Template PRO selezionato</p>
                        <p className="text-xs text-amber-600 mt-0.5">Passa al Piano Pro per scaricare e salvare con questo template.</p>
                      </div>
                    </div>
                  )}

                  {quotaError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                      <span className="text-red-500 mt-0.5 text-lg leading-none">⚠</span>
                      <div>
                        <p className="text-sm font-bold text-red-700">Limite raggiunto</p>
                        <p className="text-xs text-red-600 mt-0.5">{quotaError}</p>
                        <a href="/impostazioni?tab=piano" className="text-xs font-bold text-[#5c32e6] underline mt-1 inline-block">
                          Scopri i piani →
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={handleDownloadPDF}
                      disabled={downloading || isProTemplate || quotaBlocked}
                      className="w-full h-14 rounded-2xl bg-white dark:bg-white border-2 border-[#5c32e6] text-[#5c32e6] hover:bg-indigo-50 font-bold text-lg transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {quotaBlocked ? <Lock className="w-5 h-5 mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                      {downloading ? "Generazione PDF..." : quotaBlocked ? "Crediti esauriti" : "Scarica PDF"}
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isProTemplate || quotaBlocked || saving}
                      className="w-full h-14 rounded-2xl bg-[#5c32e6] hover:bg-[#4b27cb] text-white font-bold text-lg shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {quotaBlocked ? (
                        <><Lock className="w-5 h-5 mr-2" /> Crediti esauriti</>
                      ) : saving ? (
                        <>Salvataggio...</>
                      ) : (
                        <><Save className="w-5 h-5 mr-2" /> Salva nello Storico</>
                      )}
                    </Button>
                  </div>

                  {sendError && (
                    <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{sendError}</p>
                  )}

                  <Button
                    onClick={() => setSendDialogOpen(true)}
                    disabled={sending || isProTemplate || quotaBlocked || !currentQuote.client?.email}
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    size="lg"
                    title={!currentQuote.client?.email ? 'Inserisci l\'email del cliente per abilitare l\'invio' : undefined}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    {sending ? 'Salvataggio e invio…' : currentQuote.client?.email ? 'Salva e Invia al Cliente' : 'Email cliente mancante'}
                  </Button>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
                    <p className="font-semibold text-slate-600 mb-1">Vuoi inviarlo in un secondo momento?</p>
                    <p>Puoi trovare il pulsante <span className="font-medium text-slate-700">&quot;Invia al cliente&quot;</span> anche in:</p>
                    <ul className="mt-1.5 space-y-0.5 list-none">
                      <li>• <span className="font-medium text-slate-700">Storico Preventivi</span> → menu azioni (⋯) accanto al preventivo</li>
                      <li>• <span className="font-medium text-slate-700">Dettaglio Preventivo</span> → pannello azioni a destra</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Mobile Preview Toggle */}
        <div className="lg:hidden fixed bottom-6 left-4 z-30">
          <Button
            onClick={() => setMobilePreview(!mobilePreview)}
            className="h-12 px-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 font-bold text-sm gap-2"
          >
            <FileText className="w-4 h-4" />
            Anteprima
          </Button>
        </div>

        {/* Mobile Preview Overlay */}
        {mobilePreview && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <h3 className="font-bold text-foreground">Anteprima PDF</h3>
              <Button variant="ghost" size="sm" onClick={() => setMobilePreview(false)} className="font-bold">
                <ArrowLeft className="w-4 h-4 mr-1" /> Torna all&apos;editor
              </Button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Template sidebar — scrollabile verticalmente */}
              <div className="w-24 flex-shrink-0 bg-card border-r border-border overflow-y-auto">
                <TemplateSelector variant="mini" />
              </div>
              {/* PDF Preview */}
              <div className="flex-1 overflow-hidden">
                <QuotePreview quotaBlocked={quotaBlocked || noCreditsEdit} />
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar: Persistent Live Preview (Expanded) — desktop only */}
        <div className="hidden lg:flex h-full border-l border-border w-[60%] overflow-hidden transition-colors">
          {/* Style Mini Sidebar */}
          <div className="w-32 flex-shrink-0 bg-card border-r border-border h-full overflow-y-auto custom-scrollbar shadow-inner">
             <TemplateSelector variant="mini" />
          </div>
          {/* PDF Preview Area */}
          <div className="flex-1 h-full">
             <QuotePreview quotaBlocked={quotaBlocked || noCreditsEdit} />
          </div>
        </div>

        {/* No-credits edit overlay */}
        {noCreditsEdit && (
          <div className="absolute inset-0 z-50 flex items-center justify-center lg:w-[40%] pointer-events-auto">
            <div className="bg-white/80 backdrop-blur-md p-10 rounded-[3rem] border-2 border-red-200 shadow-2xl flex flex-col items-center text-center max-w-sm m-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6 border-2 border-red-100">
                <Lock className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Crediti esauriti</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Non puoi modificare o salvare questo preventivo. Passa a Starter o Pro per continuare a lavorare sui tuoi preventivi.
              </p>
              <button
                onClick={() => router.push('/impostazioni?tab=piano')}
                className="mt-8 bg-[#5c32e6] hover:bg-[#4b27cb] text-white font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-400/20 active:scale-95"
              >
                Vedi i piani →
              </button>
            </div>
          </div>
        )}

        {/* Locked Editor Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-50 flex items-center justify-center lg:w-[40%] pointer-events-auto">
             <div className="bg-white/80 backdrop-blur-md p-10 rounded-[3rem] border-2 border-amber-200 shadow-2xl flex flex-col items-center text-center max-w-sm m-6 animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mb-6 border-2 border-amber-100">
                  <Lock className="w-10 h-10 text-amber-500" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Editor Bloccato</h3>
               <p className="text-slate-600 font-medium leading-relaxed">
                 Hai selezionato un template **PRO**. Per compilare i dati e scaricare il documento con questo stile, è necessario attivare il piano Pro.
               </p>
               <button 
                 onClick={() => router.push('/impostazioni?tab=piano')}
                 className="mt-8 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-amber-400/20 active:scale-95"
               >
                 Sblocca Ora
               </button>
             </div>
          </div>
        )}

      </div>
    </div>
    <AIAssistant />
    <SendQuoteDialog
      open={sendDialogOpen}
      onOpenChange={setSendDialogOpen}
      clientEmail={currentQuote.client?.email || ''}
      clientName={currentQuote.client?.name || ''}
      quoteNumber={currentQuote.number}
      onConfirmSend={handleSendToClient}
    />
    </>
  );
}
