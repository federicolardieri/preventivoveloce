"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Loader2,
  MessageSquare,
  ArrowLeft,
  Mail,
} from "lucide-react";

type Step = "ask" | "compose" | "sending";

interface SendQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientEmail: string;
  clientName: string;
  quoteNumber: string;
  /** Called with the custom message when user confirms. Return true if send succeeded. */
  onConfirmSend: (customMessage: string) => Promise<boolean>;
}

export function SendQuoteDialog({
  open,
  onOpenChange,
  clientEmail,
  clientName,
  quoteNumber,
  onConfirmSend,
}: SendQuoteDialogProps) {
  const [step, setStep] = useState<Step>("ask");
  const [customMessage, setCustomMessage] = useState("");

  const reset = useCallback(() => {
    setStep("ask");
    setCustomMessage("");
  }, []);

  const handleClose = useCallback(
    (v: boolean) => {
      if (step === "sending") return;
      if (!v) reset();
      onOpenChange(v);
    },
    [step, reset, onOpenChange]
  );

  const doSend = async (message: string) => {
    setStep("sending");
    const ok = await onConfirmSend(message);
    if (!ok) {
      setStep("ask");
    }
    // Se ok=true, il caller fa il redirect — il dialog si chiuderà da solo
  };

  const handleSendWithoutMessage = () => doSend("");
  const handleSendWithMessage = () => doSend(customMessage.trim());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={step !== "sending"} className="sm:max-w-md">
        {/* ─── Step 1: Ask ─── */}
        {step === "ask" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-black">
                <Send className="w-5 h-5 text-primary" />
                Invia preventivo
              </DialogTitle>
              <DialogDescription>
                Stai per inviare il preventivo{" "}
                <strong className="text-foreground">{quoteNumber}</strong> a{" "}
                <strong className="text-foreground">{clientName || clientEmail}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Recipient */}
              <div className="bg-muted/40 rounded-xl px-4 py-3 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Destinatario
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {clientEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Question */}
              <p className="text-sm font-bold text-foreground text-center">
                Vuoi aggiungere un messaggio personalizzato?
              </p>

              {/* Buttons */}
              <div className="space-y-2.5">
                <Button
                  onClick={() => setStep("compose")}
                  variant="outline"
                  className="w-full h-11 rounded-xl font-bold text-sm gap-2.5 border-border"
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Sì, scrivi un messaggio
                </Button>
                <Button
                  onClick={handleSendWithoutMessage}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm gap-2.5 shadow-lg shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                  Invia senza messaggio
                </Button>
              </div>

              {/* Hint */}
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                L&apos;email includerà il PDF in allegato e il link per l&apos;accettazione online.
              </p>
            </div>
          </>
        )}

        {/* ─── Step 2: Compose message ─── */}
        {step === "compose" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("ask")}
                  className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <DialogTitle className="flex items-center gap-2 text-lg font-black">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Scrivi il tuo messaggio
                </DialogTitle>
              </div>
              <DialogDescription>
                Verrà mostrato nel corpo dell&apos;email al cliente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Textarea */}
              <div className="space-y-1.5">
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={`Es. Gentile ${clientName || "cliente"}, in allegato il preventivo come da accordi. Resto a disposizione per qualsiasi chiarimento.`}
                  className="resize-none h-32 bg-muted/30 border-border focus-visible:ring-primary/20 rounded-xl text-sm placeholder:text-muted-foreground/40"
                  maxLength={1000}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                  {customMessage.length}/1000
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setStep("ask")}
                  className="rounded-xl font-bold"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSendWithMessage}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-lg shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                  Invia email
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ─── Step 3: Sending ─── */}
        {step === "sending" && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Invio in corso</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
              <p className="text-base font-black text-foreground tracking-tight mb-1">
                Invio in corso…
              </p>
              <p className="text-sm text-muted-foreground">
                Stiamo inviando il preventivo a {clientName || clientEmail}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
