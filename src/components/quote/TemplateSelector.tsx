"use client";

import { useState } from "react";
import { useQuoteStore } from "@/store/quoteStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Palette, Lock, Zap } from "lucide-react";
import { TemplateId } from "@/types/quote";
import { TemplateCustomizerModal } from "./TemplateCustomizerModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  pro?: boolean;
  pages?: number;
}

interface TemplateSelectorProps {
  variant?: "full" | "mini";
}

const templates: TemplateConfig[] = [
  { id: "classic",    name: "Classico",    description: "Header bianco con linea colorata" },
  { id: "modern",     name: "Moderno",     description: "Header a sfondo pieno, stile SaaS" },
  { id: "minimal",    name: "Minimal",     description: "Solo testo, spaziatura generosa" },
  { id: "bold",       name: "Bold",        description: "Sidebar verticale colorata" },
  { id: "corporate",  name: "Corporate",   description: "Layout strutturato con indirizzi" },
  { id: "creative",   name: "Creative",    description: "Layout a due colonne vivace" },
  { id: "cover-page", name: "Cover Page",  description: "Copertina + preventivo dettagliato", pro: true, pages: 2 },
  { id: "executive",  name: "Executive",   description: "Summary + dettaglio con firma", pro: true, pages: 2 },
];

function TemplateThumbnail({ id, primaryColor, locked }: { id: TemplateId; primaryColor: string; locked?: boolean }) {
  return (
    <div className="w-full h-[72px] bg-background border border-border rounded-lg overflow-hidden relative shadow-inner">
      {id === "classic" && (
        <>
          <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
          <div className="px-2 pt-1.5 space-y-1">
            <div className="h-1.5 w-1/3 bg-slate-300 rounded" />
            <div className="h-1 w-1/2 bg-slate-200 rounded" />
          </div>
          <div className="mx-2 mt-2 h-6 bg-slate-200/70 rounded" />
        </>
      )}
      {id === "modern" && (
        <>
          <div className="h-7 w-full flex items-center px-2 gap-1" style={{ backgroundColor: primaryColor }}>
            <div className="w-3 h-3 rounded-sm bg-white/30" />
            <div className="h-1 w-1/3 bg-white/50 rounded" />
          </div>
          <div className="px-2 pt-1.5 space-y-1">
            <div className="h-1 w-1/2 bg-slate-200 rounded" />
            <div className="mt-1 h-5 bg-slate-200/70 rounded" />
          </div>
        </>
      )}
      {id === "minimal" && (
        <div className="px-2 pt-2 space-y-1.5">
          <div className="h-1.5 w-2/5 bg-slate-300 rounded" />
          <div className="h-px w-full bg-slate-200" />
          <div className="h-1 w-3/4 bg-slate-200 rounded" />
          <div className="h-1 w-1/2 bg-slate-100 rounded" />
          <div className="h-1 w-2/3 bg-slate-100 rounded" />
        </div>
      )}
      {id === "bold" && (
        <div className="flex h-full">
          <div className="w-5 h-full flex-shrink-0" style={{ backgroundColor: primaryColor }} />
          <div className="flex-1 px-1.5 pt-2 space-y-1">
            <div className="h-1.5 w-1/2 bg-slate-300 rounded" />
            <div className="h-1 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200/70 rounded mt-1" />
          </div>
        </div>
      )}
      {id === "corporate" && (
        <>
          <div className="h-2 w-full" style={{ backgroundColor: primaryColor }} />
          <div className="px-2 pt-1.5 flex gap-1.5">
            <div className="flex-1 space-y-0.5 bg-slate-100 rounded p-1">
              <div className="h-1 w-full bg-slate-300 rounded" />
              <div className="h-1 w-2/3 bg-slate-200 rounded" />
            </div>
            <div className="flex-1 space-y-0.5 bg-slate-100 rounded p-1">
              <div className="h-1 w-full bg-slate-300 rounded" />
              <div className="h-1 w-2/3 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="mx-2 mt-1.5 h-4 bg-slate-200/70 rounded" />
        </>
      )}
      {id === "creative" && (
        <div className="p-2 space-y-1">
          <div className="flex gap-1 h-2">
            <div className="flex-1 rounded" style={{ backgroundColor: primaryColor }} />
            <div className="flex-1 rounded bg-slate-300" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-1/2 bg-slate-100 rounded p-1 space-y-0.5">
              <div className="h-1 w-full bg-slate-300 rounded" />
              <div className="h-1 w-2/3 bg-slate-200 rounded" />
            </div>
            <div className="w-1/2 bg-slate-100 rounded p-1 space-y-0.5">
              <div className="h-1 w-full bg-slate-300 rounded" />
              <div className="h-1 w-2/3 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="h-3 bg-slate-200/70 rounded" />
        </div>
      )}
      {id === "cover-page" && (
        <div className="flex h-full">
          {/* Page 1 mini */}
          <div className="w-[46%] h-full flex flex-col p-1" style={{ backgroundColor: primaryColor }}>
            <div className="w-5 h-1.5 bg-white/30 rounded mb-1" />
            <div className="flex-1 flex items-center justify-center">
              <div className="space-y-0.5 text-center">
                <div className="h-1.5 w-8 bg-white/60 rounded mx-auto" />
                <div className="h-1 w-5 bg-white/30 rounded mx-auto" />
              </div>
            </div>
            <div className="h-1 w-full bg-white/20 rounded" />
          </div>
          <div className="w-px bg-white/20" />
          {/* Page 2 mini */}
          <div className="flex-1 h-full p-1 space-y-0.5 bg-white">
            <div className="h-0.5 w-full rounded" style={{ backgroundColor: primaryColor }} />
            <div className="h-1 w-2/3 bg-slate-200 rounded" />
            <div className="h-3.5 w-full bg-slate-100 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
          </div>
        </div>
      )}
      {id === "executive" && (
        <div className="flex h-full">
          {/* Page 1 mini */}
          <div className="w-[46%] h-full flex flex-col bg-slate-800">
            <div className="h-1" style={{ backgroundColor: primaryColor }} />
            <div className="flex-1 p-1 space-y-0.5">
              <div className="h-1 w-3/4 bg-white/20 rounded" />
              <div className="h-1 w-1/2 bg-white/10 rounded" />
              <div className="mt-1 px-1 py-0.5 rounded" style={{ backgroundColor: primaryColor }}>
                <div className="h-1 w-full bg-white/40 rounded" />
              </div>
            </div>
          </div>
          <div className="w-px bg-slate-200" />
          {/* Page 2 mini */}
          <div className="flex-1 h-full p-1 space-y-0.5 bg-white">
            <div className="h-0.5 w-full rounded" style={{ backgroundColor: primaryColor }} />
            <div className="h-1 w-2/3 bg-slate-200 rounded" />
            <div className="h-3.5 w-full bg-slate-100 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
          </div>
        </div>
      )}

      {/* Overlay for locked templates */}
      {locked && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
          <Lock className="w-4 h-4 text-white drop-shadow" />
        </div>
      )}
    </div>
  );
}

export function TemplateSelector({ variant = "full" }: TemplateSelectorProps) {
  const { currentQuote, updateDetails } = useQuoteStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [proPreview, setProPreview] = useState<TemplateConfig | null>(null);

  if (!currentQuote) return null;

  const primaryColor = currentQuote.theme.primaryColor;

  if (variant === "mini") {
    return (
      <>
        <div className="flex flex-col items-center gap-6 py-6 w-full h-full custom-scrollbar">
          <div className="flex flex-col items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setModalOpen(true)}
              className="w-16 h-16 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 shrink-0 border border-primary/20 shadow-sm"
              title="Personalizza Colori e Font"
            >
              <Palette className="w-8 h-8" />
            </Button>
            <span className="text-[10px] font-black text-primary uppercase tracking-tighter text-center px-2">Personalizza</span>
          </div>

          <div className="w-full flex-1 flex flex-col items-center gap-6 pb-10">
            {templates.map((tpl) => {
              const isActive = currentQuote.template === tpl.id;
              const isPro = tpl.pro === true;

              return (
                <div
                  key={tpl.id}
                  onClick={() => updateDetails({ template: tpl.id as TemplateId })}
                  className="flex flex-col items-center gap-2 group w-full"
                >
                  <div
                    className={`relative w-[72px] h-[72px] rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95 overflow-hidden border-2 flex-shrink-0 ${
                      isActive 
                        ? "border-primary shadow-xl shadow-primary/20 scale-110" 
                        : isPro 
                          ? "border-amber-200 hover:border-amber-400 group-hover:border-amber-300" 
                          : "border-border/50 hover:border-primary/40"
                    }`}
                    title={`${tpl.name}${isPro ? " (Piano PRO)" : ""}`}
                  >
                    <div className="absolute inset-0 scale-[1.3] origin-top">
                      <TemplateThumbnail id={tpl.id} primaryColor={primaryColor} locked={false} />
                    </div>
                    
                    {isPro && !isActive && (
                      <div className="absolute top-1 right-1 z-10 text-amber-500 bg-white/80 rounded-full p-0.5 shadow-sm">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                      </div>
                    )}
                    
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center ring-2 ring-background shadow-lg">
                           <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider text-center font-bold px-1 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}>
                    {tpl.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <TemplateCustomizerModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Card className="shadow-sm border-border bg-card transition-colors">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground tracking-tight">
              Stile Documento
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-8 gap-1.5 text-xs font-bold border-border text-primary hover:bg-primary/10 transition-all rounded-xl shadow-sm"
            >
              <Palette className="w-3.5 h-3.5" />
              Personalizza
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {templates.map((tpl) => {
              const isActive = currentQuote.template === tpl.id;
              const isPro = tpl.pro === true;

              return (
                <div
                  key={tpl.id}
                  onClick={() => updateDetails({ template: tpl.id as TemplateId })}
                  className={`relative rounded-2xl border-2 p-3 flex flex-col transition-all group shadow-sm cursor-pointer ${
                    isPro && isActive
                      ? "border-amber-400 bg-amber-50/60"
                      : isPro
                        ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-900/10 hover:border-amber-300"
                        : isActive
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  {/* Active check (anche per PRO — mostra anteprima selezionata) */}
                  {isActive && !isPro && (
                    <div className="absolute top-2 right-2 z-10 h-6 w-6 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-in zoom-in">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                  {isActive && isPro && (
                    <div className="absolute top-2 right-2 z-10 h-6 w-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                      <Zap className="h-3 w-3 text-amber-900" />
                    </div>
                  )}

                  {/* PRO badge — nascosto quando active (sostituito dal check sopra) */}
                  {isPro && !isActive && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 bg-amber-400 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      <Zap className="w-2.5 h-2.5" />
                      PRO
                    </div>
                  )}

                  {/* Pages badge */}
                  {tpl.pages && (
                    <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-full border border-white/10">
                      {tpl.pages} {tpl.pages > 1 ? 'PAGINE' : 'PAGINA'}
                    </div>
                  )}

                  <div
                    className="relative overflow-hidden rounded-xl mb-3 shadow-inner bg-background/50 transition-transform group-hover:scale-[1.02]"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateDetails({ template: tpl.id as TemplateId });
                      if (!isPro) setModalOpen(true);
                    }}
                  >
                    <TemplateThumbnail id={tpl.id} primaryColor={primaryColor} locked={false} />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform ${
                        isPro
                          ? "bg-amber-400 text-amber-900 shadow-amber-300/50"
                          : "bg-primary text-primary-foreground shadow-primary/30"
                      }`}>
                        {isPro ? "Anteprima PRO 👁" : "Personalizza ✨"}
                      </span>
                    </div>
                  </div>

                  <h4 className={`font-bold text-sm tracking-tight ${
                    isPro ? "text-amber-600 dark:text-amber-500" : isActive ? "text-primary font-black" : "text-foreground font-bold"
                  }`}>
                    {tpl.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 font-medium">{tpl.description}</p>

                  {isPro && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      Richiede Piano Pro
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <TemplateCustomizerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* PRO template preview dialog */}
      <Dialog open={!!proPreview} onOpenChange={() => setProPreview(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              {proPreview?.name}
              {proPreview?.pages && (
                <span className="text-xs font-normal text-slate-400">{proPreview.pages} pagine</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {proPreview && (
              <div className="relative w-full rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-900/50 shadow-inner bg-background" style={{ height: 200 }}>
                <div style={{ transform: 'scale(2.7)', transformOrigin: 'top left', width: '37%', height: '37%' }}>
                  <TemplateThumbnail id={proPreview.id} primaryColor={primaryColor} locked={false} />
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">{proPreview?.description}</p>
            <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/30">
                 <Lock className="w-5 h-5 text-amber-900" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900 dark:text-amber-500">Disponibile con Piano Pro</p>
                <p className="text-xs text-amber-700/70 dark:text-amber-500/70 mt-0.5 font-medium">Sblocca tutti i template premium e funzionalità avanzate.</p>
              </div>
            </div>
            <Button
              className="w-full h-12 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-900 font-black text-sm transition-all shadow-xl shadow-amber-400/20 active:scale-[0.98] gap-2"
              onClick={() => setProPreview(null)}
            >
              <Zap className="w-4 h-4" />
              Upgrade a Pro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
