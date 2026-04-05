"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuoteStore } from "@/store/quoteStore";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import { QuoteItem, VatRate } from "@/types/quote";
import { Sparkles, X, Send, Loader2, Bot, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  text: string;
  applied?: boolean;
}

interface AiFields {
  client?: Record<string, string>;
  sender?: Record<string, string>;
  details?: {
    notes?: string;
    paymentTerms?: string;
    validityDays?: number;
  };
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    discountType: 'percentage' | 'fixed';
    vatRate: number;
  }[];
}

const VALID_VAT_RATES: VatRate[] = [0, 4, 10, 22];

function sanitizeVat(v: unknown): VatRate {
  const n = Number(v);
  return (VALID_VAT_RATES.includes(n as VatRate) ? n : 22) as VatRate;
}

export function AIAssistant() {
  const { isAiAssistantOpen: open, setAiAssistantOpen: setOpen, aiPrompt, setAiPrompt } = useUIStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Ciao! Descrivimi i dati del preventivo e li compilo per te. Ad esempio: "Il cliente è Mario Rossi di Acme SRL, P.IVA 01234567890, vuole 3 giorni di consulenza a €500 al giorno + IVA 22%"',
    },
  ]);
  const [pendingFields, setPendingFields] = useState<AiFields | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { updateClient, updateSender, updateDetails, addItem, currentQuote, setCurrentQuote, quotesList } = useQuoteStore();

  // Watch for external prompts (Magic Box)
  useEffect(() => {
    if (aiPrompt.trim() && open) {
      handleSend(aiPrompt.trim());
      setAiPrompt(''); // Clear after sending
    }
  }, [aiPrompt, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const startNewQuote = () => {
    const year = new Date().getFullYear();
    const nextNumber = quotesList.length + 1;
    const padded = nextNumber.toString().padStart(3, "0");
    const newQuote = {
      id: crypto.randomUUID(),
      number: `PRV-${year}-${padded}`,
      status: "bozza" as const,
      template: "classic" as const,
      theme: {
        primaryColor: "#5c32e6",
        accentColor: "#1d4ed8",
        textColor: "#1e293b",
        fontFamily: "Helvetica" as const,
        tableStyle: "striped" as const,
        logoPosition: "left" as const,
        showFooterNotes: true,
        showPaymentTerms: true,
      },
      sender: { name: "", address: "", city: "", postalCode: "", country: "", vatNumber: "", email: "", phone: "" },
      client: { name: "", address: "", city: "", postalCode: "", country: "", vatNumber: "", email: "", phone: "" },
      items: [],
      notes: "",
      paymentTerms: "Bonifico bancario a 30 giorni data fattura",
      validityDays: 30,
      currency: "EUR" as const,
      itemCustomColumns: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentQuote(newQuote);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const historyForApi = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    text: m.text,
  }));

  const applyFields = (fields: AiFields) => {
    if (fields.client && Object.keys(fields.client).length > 0) {
      updateClient(fields.client as Parameters<typeof updateClient>[0]);
    }
    if (fields.sender && Object.keys(fields.sender).length > 0) {
      updateSender(fields.sender as Parameters<typeof updateSender>[0]);
    }
    if (fields.details) {
      const d = fields.details;
      updateDetails({
        ...(d.notes !== undefined && { notes: d.notes }),
        ...(d.paymentTerms !== undefined && { paymentTerms: d.paymentTerms }),
        ...(d.validityDays !== undefined && { validityDays: d.validityDays }),
      });
    }
    if (fields.items && fields.items.length > 0) {
      fields.items.forEach(item => {
        const newItem: QuoteItem = {
          id: crypto.randomUUID(),
          description: item.description ?? '',
          quantity: Number(item.quantity) || 1,
          unitPrice: Math.round(Number(item.unitPrice)) || 0,
          discount: Number(item.discount) || 0,
          discountType: item.discountType === 'fixed' ? 'fixed' : 'percentage',
          vatRate: sanitizeVat(item.vatRate),
        };
        addItem(newItem);
      });
    }
    setPendingFields(null);
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setLoading(true);
    setPendingFields(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyForApi, quoteId: currentQuote?.id }),
      });

      if (res.status === 403 || res.status === 429) {
        const err = await res.json();
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          text: err.message ?? 'Limite raggiunto. Riprova tra qualche secondo.',
        }]);
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error('Errore server');

      const data = await res.json();
      const replyText: string = data.message ?? 'Ho elaborato le informazioni.';

      if (data.action === 'fill_quote' && data.fields) {
        const fields = data.fields as AiFields;
        const hasData = fields.client || fields.sender || fields.details || (fields.items?.length ?? 0) > 0;

        setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
        if (hasData) {
          setPendingFields(fields);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Si è verificato un errore. Riprova.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const summarizeFields = (fields: AiFields): string => {
    const parts: string[] = [];
    if (fields.client?.name) parts.push(`Cliente: ${fields.client.name}`);
    if (fields.sender?.name) parts.push(`Mittente: ${fields.sender.name}`);
    if (fields.items?.length) parts.push(`${fields.items.length} voce/i`);
    if (fields.details?.notes) parts.push('Note');
    if (fields.details?.paymentTerms) parts.push('Termini pagamento');
    return parts.join(' · ') || 'dati';
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-2xl shadow-indigo-500/30 transition-all hover:-translate-y-0.5",
          open
            ? "bg-slate-700 text-white"
            : "bg-[#5c32e6] text-white"
        )}
      >
        {open ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        {open ? 'Chiudi' : 'Assistente AI'}
      </button>
      {/* Chat panel */}
      {open && (
        <motion.div 
          drag
          dragMomentum={false}
          dragConstraints={{ left: -window.innerWidth + 400, right: 0, top: -window.innerHeight + 500, bottom: 0 }}
          className="fixed bottom-24 right-2 sm:right-6 z-50 w-[calc(100vw-16px)] sm:w-[380px] bg-card rounded-3xl shadow-2xl shadow-black/15 border border-border flex flex-col overflow-hidden transition-colors"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header - Drag Handle */}
          <div className="bg-[#5c32e6] px-5 py-4 flex items-center gap-3 cursor-move active:cursor-grabbing">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center pointer-events-none">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 pointer-events-none">
              <p className="text-sm font-bold text-white">Agente Virtuale AI</p>
              <p className="text-[11px] text-white/60">Crea preventivi in pochi secondi</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }} 
              className="text-white/60 hover:text-white transition-colors relative z-10 p-1"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Banner if no quote is active */}
          {!currentQuote && (
            <div className="bg-primary/5 border-b border-border p-4">
              <p className="text-xs text-card-foreground font-bold mb-2 leading-relaxed">
                Nessun preventivo attivo. Inizia a parlare per crearne uno nuovo istantaneamente!
              </p>
              <Button 
                onClick={startNewQuote}
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-xs h-8 font-bold rounded-lg shadow-sm"
              >
                + Crea Nuovo Preventivo
              </Button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: 380 }}>
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "px-3 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed font-medium transition-colors",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/10"
                    : "bg-muted text-card-foreground rounded-tl-sm"
                )}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-muted px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1.5 border border-border/50">
                  <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                  <span className="text-xs text-muted-foreground font-bold">Elaborazione...</span>
                </div>
              </div>
            )}

            {/* Confirm card */}
            {pendingFields && !loading && (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 shadow-xl shadow-primary/5 mx-4 mb-4">
                <p className="text-xs font-black text-primary uppercase tracking-wider mb-2">
                  Pronto a compilare ✨
                </p>
                <p className="text-xs font-bold text-card-foreground/80 mb-4 leading-tight">
                  {summarizeFields(pendingFields)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs h-9 font-black shadow-lg shadow-primary/20"
                    onClick={() => applyFields(pendingFields)}
                  >
                    ✓ Applica
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl text-xs h-9 border-border bg-background hover:bg-muted font-bold"
                    onClick={() => setPendingFields(null)}
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card">
            <div className="flex gap-2 items-center bg-muted/50 rounded-2xl px-4 py-3 border border-border/50 focus-within:border-primary/50 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Es: Cliente Mario Rossi, P.IVA 12345..."
                className="flex-1 bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground outline-none font-medium"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-md shadow-primary/20 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
