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
  RefreshCw,
  Clock,
  Send,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FOLLOWUP_TEMPLATES, getTemplatePreviewText, type FollowUpTemplateId } from "@/lib/followup-templates";
import { format, addDays, addWeeks } from "date-fns";
import { it } from "date-fns/locale";

type Step = "timing" | "template" | "confirm";

interface FollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  clientEmail: string;
  clientName: string;
  quoteNumber: string;
  validityDays: number;
  onSuccess?: (immediate: boolean) => void;
}

type SchedulingMode = "days-3" | "days-7" | "days-14" | "expiry" | "custom" | null;

const PRESET_OPTIONS: { label: string; mode: SchedulingMode }[] = [
  { label: "Tra 3 giorni", mode: "days-3" },
  { label: "Tra 1 settimana", mode: "days-7" },
  { label: "Tra 2 settimane", mode: "days-14" },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
  ["00", "30"].map((m) => `${String(h).padStart(2, "0")}:${m}`)
).flat();

export function FollowUpDialog({
  open,
  onOpenChange,
  quoteId,
  clientEmail,
  clientName,
  quoteNumber,
  validityDays,
  onSuccess,
}: FollowUpDialogProps) {
  const [step, setStep] = useState<Step>("timing");
  const [isImmediate, setIsImmediate] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>(null);
  const [customDays, setCustomDays] = useState<number>(7);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [templateId, setTemplateId] = useState<FollowUpTemplateId>("reminder_1");
  const [message, setMessage] = useState(
    getTemplatePreviewText("reminder_1", { clientName, quoteNumber, validityDays })
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scheduledLabel, setScheduledLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep("timing");
    setIsImmediate(false);
    setSchedulingMode(null);
    setCustomDays(7);
    setSelectedTime("09:00");
    setTemplateId("reminder_1");
    setMessage(getTemplatePreviewText("reminder_1", { clientName, quoteNumber, validityDays }));
    setLoading(false);
    setSuccess(false);
    setError(null);
    setScheduledLabel("");
  }, [clientName, quoteNumber, validityDays]);

  const handleClose = useCallback(
    (v: boolean) => {
      if (loading) return;
      if (!v) reset();
      onOpenChange(v);
    },
    [loading, reset, onOpenChange]
  );

  const handleSelectTemplate = (id: FollowUpTemplateId) => {
    setTemplateId(id);
    setMessage(getTemplatePreviewText(id, { clientName, quoteNumber, validityDays }));
  };

  const getScheduledDate = (): Date | null => {
    switch (schedulingMode) {
      case "days-3": return addDays(new Date(), 3);
      case "days-7": return addWeeks(new Date(), 1);
      case "days-14": return addWeeks(new Date(), 2);
      case "expiry": return addDays(new Date(), validityDays);
      case "custom": return addDays(new Date(), customDays > 0 ? customDays : 1);
      default: return null;
    }
  };

  const getScheduledFor = (): string | null => {
    if (isImmediate) return null;
    const base = getScheduledDate();
    if (!base) return null;
    const [h, m] = selectedTime.split(":").map(Number);
    base.setHours(h, m, 0, 0);
    return base.toISOString();
  };

  const buildScheduledLabel = (): string => {
    if (isImmediate) return "Subito";
    const base = getScheduledDate();
    if (!base) return "";
    const [h, m] = selectedTime.split(":").map(Number);
    base.setHours(h, m, 0, 0);
    return format(base, "EEEE d MMMM 'alle' HH:mm", { locale: it });
  };

  const handleGoToTemplate = (immediate: boolean) => {
    setIsImmediate(immediate);
    setStep("template");
  };

  const handleGoToConfirm = () => {
    setScheduledLabel(buildScheduledLabel());
    setStep("confirm");
  };

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/followup/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          scheduledFor: getScheduledFor(),
          templateId,
          customMessage: message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Errore durante l'invio");
        return;
      }
      setSuccess(true);
      onSuccess?.(isImmediate);
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={!loading} className="sm:max-w-md">

        {/* ─── Step 1: Timing ─── */}
        {step === "timing" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-black">
                <RefreshCw className="w-5 h-5 text-primary" />
                Invia Follow-up
              </DialogTitle>
              <DialogDescription>
                Preventivo <strong className="text-foreground">{quoteNumber}</strong> a{" "}
                <strong className="text-foreground">{clientName || clientEmail}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              <Button
                onClick={() => handleGoToTemplate(true)}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-lg shadow-primary/20"
              >
                <Send className="w-4 h-4" />
                Invia ora
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground font-bold uppercase tracking-widest">
                    Oppure programma
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_OPTIONS.map((opt) => (
                    <button
                      key={opt.mode}
                      onClick={() => setSchedulingMode(opt.mode)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-xs font-bold transition-all text-center",
                        schedulingMode === opt.mode
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setSchedulingMode("expiry")}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-xs font-bold transition-all text-center",
                    schedulingMode === "expiry"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  Alla scadenza (tra {validityDays} giorni)
                </button>

                <div
                  onClick={() => setSchedulingMode("custom")}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                    schedulingMode === "custom"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <span>Giorni personalizzati:</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setSchedulingMode("custom");
                      setCustomDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)));
                    }}
                    className="w-14 rounded-lg border border-current bg-transparent px-2 py-0.5 text-center font-bold focus:outline-none"
                  />
                  <span>giorni</span>
                </div>
              </div>

              {schedulingMode !== null && (
                <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3 border border-border">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground flex-1">Orario</span>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {schedulingMode !== null && (
                <Button
                  onClick={() => handleGoToTemplate(false)}
                  variant="outline"
                  className="w-full h-11 rounded-xl font-bold border-border gap-2"
                >
                  <Clock className="w-4 h-4 text-primary" />
                  Programma invio
                </Button>
              )}
            </div>
          </>
        )}

        {/* ─── Step 2: Template ─── */}
        {step === "template" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("timing")}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <DialogTitle className="text-lg font-black">Scrivi il messaggio</DialogTitle>
              </div>
              <DialogDescription>
                Scegli un template o scrivi da zero
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Tab template */}
              <div className="flex gap-1.5 flex-wrap">
                {FOLLOWUP_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTemplate(t.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-bold transition-all border",
                      templateId === t.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  onClick={() => handleSelectTemplate("custom")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-all border",
                    templateId === "custom"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40"
                  )}
                >
                  Scrivi di tuo
                </button>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <Textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setTemplateId("custom");
                  }}
                  placeholder="Scrivi il tuo messaggio di follow-up…"
                  className="resize-none h-36 bg-muted/30 border-border focus-visible:ring-primary/20 rounded-xl text-sm placeholder:text-muted-foreground/40"
                  maxLength={1000}
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                  {message.length}/1000
                </p>
              </div>

              <div className="flex justify-end gap-2.5">
                <Button variant="outline" onClick={() => setStep("timing")} className="rounded-xl font-bold">
                  Indietro
                </Button>
                <Button
                  onClick={handleGoToConfirm}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-lg shadow-primary/20"
                >
                  Avanti →
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ─── Step 3: Conferma ─── */}
        {step === "confirm" && !success && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("template")}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <DialogTitle className="text-lg font-black">Conferma invio</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              <div className="bg-muted/30 rounded-xl border border-border divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Destinatario</span>
                  <span className="text-sm font-bold text-foreground">{clientEmail}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Invio</span>
                  <span className="text-sm font-bold text-foreground capitalize">{scheduledLabel}</span>
                </div>
              </div>

              {message.trim() && (
                <div className="bg-muted/20 rounded-xl border border-border px-4 py-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Anteprima messaggio</p>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line line-clamp-4">
                    {message}
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 font-bold text-center">{error}</p>
              )}

              <div className="flex justify-end gap-2.5">
                <Button variant="outline" onClick={() => setStep("template")} className="rounded-xl font-bold" disabled={loading}>
                  Indietro
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={loading}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 shadow-lg shadow-primary/20 min-w-[120px]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isImmediate ? (
                    <><Send className="w-4 h-4" /> Invia ora</>
                  ) : (
                    <><Clock className="w-4 h-4" /> Programma</>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ─── Successo ─── */}
        {success && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Follow-up {isImmediate ? "inviato" : "programmato"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-base font-black text-foreground tracking-tight mb-1">
                {isImmediate ? "Follow-up inviato!" : "Follow-up programmato ✓"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isImmediate
                  ? `Email inviata a ${clientName || clientEmail}`
                  : `Invio programmato per ${scheduledLabel}`}
              </p>
              <Button
                onClick={() => handleClose(false)}
                variant="outline"
                className="mt-6 rounded-xl font-bold"
              >
                Chiudi
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
