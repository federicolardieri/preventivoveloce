"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuoteStore } from "@/store/quoteStore";
import { TemplateId, FontFamily, TableStyle, LogoPosition } from "@/types/quote";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuotePreview } from "./QuotePreview";
import { LogoUpload } from "./LogoUpload";
import { useState } from "react";
import { Check, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Maximize2, X } from "lucide-react";

const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
  { id: "classic",   name: "Classico",   description: "Header bianco con linea colorata" },
  { id: "modern",    name: "Moderno",    description: "Header a sfondo pieno" },
  { id: "minimal",   name: "Minimal",    description: "Solo testo, spaziatura generosa" },
  { id: "bold",      name: "Bold",       description: "Sidebar verticale colorata" },
  { id: "corporate", name: "Corporate",  description: "Layout strutturato con indirizzi" },
  { id: "creative",  name: "Creative",   description: "Layout a due colonne vivace" },
];

const TABLE_STYLES: { value: TableStyle; label: string; preview: React.ReactNode }[] = [
  {
    value: "striped",
    label: "Alternate",
    preview: (
      <div className="w-full space-y-0.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 rounded-sm ${i % 2 === 0 ? "bg-slate-200" : "bg-slate-100"}`} />
        ))}
      </div>
    ),
  },
  {
    value: "bordered",
    label: "Bordi",
    preview: (
      <div className="w-full border border-slate-300 rounded-sm divide-y divide-slate-300">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 bg-white" />
        ))}
      </div>
    ),
  },
  {
    value: "minimal",
    label: "Minimal",
    preview: (
      <div className="w-full space-y-0.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 border-b border-slate-200" />
        ))}
      </div>
    ),
  },
];

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-9 h-9 rounded-lg border-2 border-slate-200 shadow-sm flex-shrink-0 transition-transform hover:scale-105"
              style={{ backgroundColor: value }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" side="right">
            <HexColorPicker color={value} onChange={onChange} />
          </PopoverContent>
        </Popover>
        <Input
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 font-mono text-sm w-28"
          maxLength={7}
        />
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full group"
    >
      <span className="text-sm text-slate-700">{label}</span>
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${
          value ? "bg-indigo-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// Templates that meaningfully use the accent/secondary color
const TEMPLATES_WITH_ACCENT = new Set<TemplateId>(['classic', 'modern', 'corporate', 'creative', 'cover-page', 'executive']);

export function TemplateCustomizerModal({ open, onClose }: Props) {
  const { currentQuote, updateDetails, updateTheme } = useQuoteStore();
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

  if (!currentQuote) return null;

  const { theme } = currentQuote;
  const showAccentColor = TEMPLATES_WITH_ACCENT.has(currentQuote.template);

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="!max-w-[96vw] sm:!max-w-[96vw] w-[1200px] !max-h-[90vh] h-[85vh] !p-0 flex flex-col !gap-0 overflow-hidden !rounded-2xl">

        {/* Header */}
        <DialogHeader className="px-4 md:px-6 py-3 md:py-4 border-b flex-shrink-0">
          <DialogTitle className="text-base md:text-lg font-bold text-slate-900">
            Personalizza Template
          </DialogTitle>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Scegli il layout e personalizza colori, font e stile della tabella.
          </p>
        </DialogHeader>

        {/* Template tabs */}
        <div className="flex items-center gap-1 md:gap-1.5 px-3 md:px-6 py-2 md:py-3 border-b bg-slate-50/80 flex-shrink-0 overflow-x-auto">
          {TEMPLATES.map((tpl) => {
            const isActive = currentQuote.template === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => updateDetails({ template: tpl.id })}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? "bg-white shadow-sm border border-slate-200 text-slate-900"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                }`}
              >
                {isActive && <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-600" />}
                {tpl.name}
                {!isActive && (
                  <span className="text-xs text-slate-400 hidden lg:inline">
                    — {tpl.description}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body — mobile: single scrollable column, desktop: side-by-side */}
        {/* Desktop layout */}
        <div className="hidden md:flex flex-row flex-1 min-h-0">
          <ScrollArea className="w-[300px] xl:w-[320px] flex-shrink-0 border-r bg-white">
            <div className="p-5 space-y-5">

              {/* Colori */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Colori</h3>
                <div className="space-y-3">
                  <ColorField
                    label="Colore Primario"
                    value={theme.primaryColor}
                    onChange={(hex) => updateTheme({ primaryColor: hex })}
                  />
                  {showAccentColor && (
                    <ColorField
                      label="Colore Accento"
                      value={theme.accentColor}
                      onChange={(hex) => updateTheme({ accentColor: hex })}
                    />
                  )}
                  <ColorField
                    label="Colore Testo"
                    value={theme.textColor}
                    onChange={(hex) => updateTheme({ textColor: hex })}
                  />
                </div>
              </section>

              <Separator />

              {/* Logo */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Brand & Logo</h3>
                </div>
                <LogoUpload />
                {!currentQuote.sender?.logo && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                    <input
                      type="checkbox"
                      id="hideLogo1"
                      checked={theme.hideLogo ?? false}
                      onChange={(e) => updateTheme({ hideLogo: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer flex-shrink-0"
                    />
                    <label htmlFor="hideLogo1" className="cursor-pointer text-sm text-slate-600">
                      Nascondi logo Preventivo Veloce nel PDF
                    </label>
                  </div>
                )}
              </section>

              <Separator />

              {/* Font */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Font</h3>
                <Select
                  value={theme.fontFamily}
                  onValueChange={(v: string) => updateTheme({ fontFamily: v as FontFamily })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Helvetica">Helvetica — Sans-Serif</SelectItem>
                    <SelectItem value="Times-Roman">Times Roman — Serif</SelectItem>
                    <SelectItem value="Courier">Courier — Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </section>

              <Separator />

              {/* Stile tabella */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Stile Tabella</h3>
                <div className="grid grid-cols-3 gap-2">
                  {TABLE_STYLES.map(({ value, label, preview }) => {
                    const isActive = theme.tableStyle === value;
                    return (
                      <button
                        key={value}
                        onClick={() => updateTheme({ tableStyle: value })}
                        className={`border-2 rounded-xl p-2.5 flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                          isActive
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-full">{preview}</div>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <Separator />

              {/* Posizione logo */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Posizione Logo</h3>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "left",   Icon: AlignLeft,   label: "Sinistra" },
                      { value: "center", Icon: AlignCenter, label: "Centro" },
                      { value: "right",  Icon: AlignRight,  label: "Destra" },
                    ] as { value: LogoPosition; Icon: React.ElementType; label: string }[]
                  ).map(({ value, Icon, label }) => {
                    const isActive = theme.logoPosition === value;
                    return (
                      <button
                        key={value}
                        onClick={() => updateTheme({ logoPosition: value })}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                          isActive
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <Separator />

              {/* Footer */}
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Elementi Footer</h3>
                <div className="space-y-3">
                  <ToggleRow
                    label="Mostra note"
                    value={theme.showFooterNotes}
                    onChange={(v) => updateTheme({ showFooterNotes: v })}
                  />
                  <ToggleRow
                    label="Termini di pagamento"
                    value={theme.showPaymentTerms}
                    onChange={(v) => updateTheme({ showPaymentTerms: v })}
                  />
                </div>
              </section>

            </div>
          </ScrollArea>

          {/* ── Right: live PDF preview ── */}
          <div className="flex-1 bg-slate-100 p-8 min-w-0 flex items-start justify-center overflow-y-auto w-full">
            <QuotePreview compact />
          </div>
        </div>

        {/* Mobile layout — single scrollable column */}
        <div className="md:hidden flex-1 overflow-y-auto min-h-0">
          {/* Controls */}
          <div className="p-4 space-y-5 bg-white">

            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Colori</h3>
              <div className="space-y-3">
                <ColorField
                  label="Colore Primario"
                  value={theme.primaryColor}
                  onChange={(hex) => updateTheme({ primaryColor: hex })}
                />
                {showAccentColor && (
                  <ColorField
                    label="Colore Accento"
                    value={theme.accentColor}
                    onChange={(hex) => updateTheme({ accentColor: hex })}
                  />
                )}
                <ColorField
                  label="Colore Testo"
                  value={theme.textColor}
                  onChange={(hex) => updateTheme({ textColor: hex })}
                />
              </div>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Brand & Logo</h3>
              </div>
              <LogoUpload />
              {!currentQuote.sender?.logo && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                  <input
                    type="checkbox"
                    id="hideLogo2"
                    checked={theme.hideLogo ?? false}
                    onChange={(e) => updateTheme({ hideLogo: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer flex-shrink-0"
                  />
                  <label htmlFor="hideLogo2" className="cursor-pointer text-sm text-slate-600">
                    Nascondi logo Preventivo Veloce nel PDF
                  </label>
                </div>
              )}
            </section>

            <Separator />

            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Font</h3>
              <Select
                value={theme.fontFamily}
                onValueChange={(v: string) => updateTheme({ fontFamily: v as FontFamily })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Helvetica">Helvetica — Sans-Serif</SelectItem>
                  <SelectItem value="Times-Roman">Times Roman — Serif</SelectItem>
                  <SelectItem value="Courier">Courier — Monospace</SelectItem>
                </SelectContent>
              </Select>
            </section>

            <Separator />

            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Stile Tabella</h3>
              <div className="grid grid-cols-3 gap-2">
                {TABLE_STYLES.map(({ value, label, preview }) => {
                  const isActive = theme.tableStyle === value;
                  return (
                    <button
                      key={value}
                      onClick={() => updateTheme({ tableStyle: value })}
                      className={`border-2 rounded-xl p-2.5 flex flex-col items-center gap-2 text-xs font-medium transition-all ${
                        isActive
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-full">{preview}</div>
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Posizione Logo</h3>
              <div className="flex gap-2">
                {(
                  [
                    { value: "left",   Icon: AlignLeft,   label: "Sinistra" },
                    { value: "center", Icon: AlignCenter, label: "Centro" },
                    { value: "right",  Icon: AlignRight,  label: "Destra" },
                  ] as { value: LogoPosition; Icon: React.ElementType; label: string }[]
                ).map(({ value, Icon, label }) => {
                  const isActive = theme.logoPosition === value;
                  return (
                    <button
                      key={value}
                      onClick={() => updateTheme({ logoPosition: value })}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                        isActive
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Elementi Footer</h3>
              <div className="space-y-3">
                <ToggleRow
                  label="Mostra note"
                  value={theme.showFooterNotes}
                  onChange={(v) => updateTheme({ showFooterNotes: v })}
                />
                <ToggleRow
                  label="Termini di pagamento"
                  value={theme.showPaymentTerms}
                  onChange={(v) => updateTheme({ showPaymentTerms: v })}
                />
              </div>
            </section>

          </div>

          {/* Live preview — below controls on mobile, tap to fullscreen */}
          <div className="bg-slate-100 p-4 border-t border-slate-200">
            <div className="flex items-center justify-center gap-2 mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Anteprima in tempo reale</p>
              <button
                onClick={() => setPreviewFullscreen(true)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setPreviewFullscreen(true)}
              className="w-full h-[50vh] block cursor-pointer"
            >
              <QuotePreview compact />
            </button>
          </div>
        </div>

        {/* Fullscreen preview overlay (mobile) */}
        {previewFullscreen && (
          <div className="md:hidden fixed inset-0 z-[60] bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
              <p className="font-bold text-foreground text-sm">Anteprima PDF</p>
              <button
                onClick={() => setPreviewFullscreen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <QuotePreview />
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-white flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-slate-400 hidden sm:block">Le modifiche vengono salvate automaticamente nel preventivo corrente.</p>
          <Button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 px-8 rounded-xl font-semibold w-full sm:w-auto"
          >
            Applica e Chiudi
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
