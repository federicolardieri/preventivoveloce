"use client";

import { useEffect, useCallback } from "react";
import { useQuoteStore } from "@/store/quoteStore";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Trash2, Maximize2, Circle, Square, Image as FullImage, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crosshair, Frame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoShape } from "@/types/quote";

// Formati accettati dal browser e convertibili in PNG per il PDF
const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.heic', '.heif'];
const ACCEPTED_MIME_PREFIXES = ['image/'];
const ACCEPT_STRING = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/bmp,image/heic,image/heif,.heic,.heif';

function isAllowedImage(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (ACCEPTED_EXTENSIONS.includes(ext)) return true;
  if (ACCEPTED_MIME_PREFIXES.some(p => file.type.startsWith(p))) return true;
  return false;
}

export function LogoUpload() {
  const { currentQuote, updateSender, updateTheme } = useQuoteStore();

  const theme = currentQuote?.theme;
  const sender = currentQuote?.sender;
  const logoShape = theme?.logoShape || 'original';
  const logoScale = theme?.logoScale || 1;
  const logoOffsetX = theme?.logoOffsetX ?? 0;
  const logoOffsetY = theme?.logoOffsetY ?? 0;
  const logoPadding = theme?.logoPadding ?? 0;
  const logoOriginal = sender?.logoOriginal;

  // Processa il logo applicando forma e scala tramite canvas
  const processLogo = useCallback(async (
    original: string,
    shape: LogoShape,
    scale: number,
    padding: number
  ) => {
    return new Promise<void>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(); return; }

        const BASE = 600;

        if (shape === 'original') {
          const ratio = Math.min(1200 / img.width, 1200 / img.height, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
          canvas.width = BASE;
          canvas.height = BASE;

          ctx.save();
          if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(BASE / 2, BASE / 2, BASE / 2, 0, Math.PI * 2);
            ctx.clip();
          } else {
            const radius = BASE * 0.12;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(0, 0, BASE, BASE, radius);
            } else {
              ctx.rect(0, 0, BASE, BASE);
            }
            ctx.clip();
          }

          // Contain: mostra tutto il logo dentro la forma senza tagliare
          // padding > 0 = più spazio attorno; padding < 0 = taglia i bordi
          const paddedBase = BASE * (1 - padding * 2);
          const imgAspect = img.width / img.height;
          let drawW: number, drawH: number;
          if (imgAspect >= 1) {
            drawW = paddedBase * scale;
            drawH = drawW / imgAspect;
          } else {
            drawH = paddedBase * scale;
            drawW = drawH * imgAspect;
          }
          const dx = (BASE - drawW) / 2;
          const dy = (BASE - drawH) / 2;
          ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, drawW, drawH);
          ctx.restore();
        }

        updateSender({ logo: canvas.toDataURL("image/png") });
        updateTheme({ hideLogo: false });
        resolve();
      };
      img.src = original;
    });
  }, [updateSender, updateTheme]);

  useEffect(() => {
    if (logoOriginal) {
      processLogo(logoOriginal, logoShape, logoScale, logoPadding);
    }
  }, [logoOriginal, logoShape, logoScale, logoPadding, processLogo]);

  if (!currentQuote) return null;

  const STEP = 4;
  const nudge = (dx: number, dy: number) => {
    updateTheme({ logoOffsetX: logoOffsetX + dx, logoOffsetY: logoOffsetY + dy });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!isAllowedImage(file)) {
      alert(
        'Formato non supportato.\n\n' +
        'Formati accettati: PNG, JPG, WEBP, GIF, SVG, BMP, HEIC, HEIF.\n\n' +
        'Seleziona un\'immagine in uno di questi formati.'
      );
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      alert('Il file è troppo grande. Il limite massimo è 6 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;

      // Verifica che il browser riesca effettivamente a decodificare l'immagine.
      // Se riesce, la converte in PNG così il generatore PDF non avrà mai problemi.
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context non disponibile');
          ctx.drawImage(img, 0, 0);
          const pngDataUrl = canvas.toDataURL('image/png');
          updateSender({ logoOriginal: pngDataUrl });
          updateTheme({ logoScale: 1 });
        } catch {
          alert(
            'Impossibile elaborare questa immagine.\n\n' +
            'Prova a convertirla in PNG o JPG prima di caricarla.'
          );
        }
      };
      img.onerror = () => {
        alert(
          'Impossibile leggere il file selezionato.\n\n' +
          'Il browser non riesce a decodificare l\'immagine.\n' +
          'Prova a convertirla in PNG o JPG prima di caricarla.'
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <Label className="text-sm font-black text-slate-900 uppercase tracking-tight">Logo Aziendale</Label>

      {logoOriginal ? (
        <div className="space-y-6">
          {/* Preview */}
          <div className="relative w-full aspect-video rounded-3xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shadow-inner">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div
              className={`relative overflow-hidden flex items-center justify-center bg-white shadow-xl transition-all duration-500 border border-slate-200/50 ${
                logoShape === 'circle' ? 'rounded-full aspect-square w-32' :
                logoShape === 'square' ? 'rounded-2xl aspect-square w-32' :
                'rounded-xl w-48 h-24'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoOriginal}
                alt="Logo Preview"
                className="pointer-events-none"
                style={{
                  transform: `scale(${logoScale})`,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white text-red-500 rounded-full w-10 h-10"
                onClick={() => updateSender({ logo: undefined, logoOriginal: undefined })}
                title="Rimuovi logo"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm">

            {/* Shape selection */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Forma del Logo</span>
              <div className="flex gap-2">
                {(
                  [
                    { id: 'original', label: 'Originale', Icon: FullImage },
                    { id: 'circle',   label: 'Cerchio',   Icon: Circle },
                    { id: 'square',   label: 'Quadrato',  Icon: Square },
                  ] as { id: LogoShape; label: string; Icon: React.ComponentType<{ className?: string }> }[]
                ).map((s) => {
                  const isActive = logoShape === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => updateTheme({ logoShape: s.id })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all font-bold text-[11px] uppercase tracking-tight ${
                        isActive
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                      }`}
                    >
                      <s.Icon className={`w-4 h-4 ${isActive ? 'fill-primary/10' : ''}`} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scale Slider */}
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dimensione / Zoom</span>
                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{Math.round(logoScale * 100)}%</span>
              </div>
              <div className="flex items-center gap-4">
                <Maximize2 className="w-4 h-4 text-slate-300" />
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={logoScale}
                  onChange={(e) => updateTheme({ logoScale: parseFloat(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-slate-100 rounded-full cursor-pointer appearance-none hover:bg-slate-200 transition-colors"
                />
              </div>
            </div>

            {/* Padding / Crop bordi */}
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Bordi</span>
                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {logoPadding > 0 ? `+${Math.round(logoPadding * 100)}` : Math.round(logoPadding * 100)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Frame className="w-4 h-4 text-slate-300" />
                <input
                  type="range"
                  min="-0.3"
                  max="0.4"
                  step="0.02"
                  value={logoPadding}
                  onChange={(e) => updateTheme({ logoPadding: parseFloat(e.target.value) })}
                  className="w-full accent-primary h-1.5 bg-slate-100 rounded-full cursor-pointer appearance-none hover:bg-slate-200 transition-colors"
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-300 font-bold px-6">
                <span>◀ Taglia</span>
                <span>Aggiungi ▶</span>
              </div>
            </div>

            {/* Position nudge */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Posizione nel PDF</span>
                {(logoOffsetX !== 0 || logoOffsetY !== 0) && (
                  <button
                    onClick={() => updateTheme({ logoOffsetX: 0, logoOffsetY: 0 })}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-3 gap-1 w-28">
                  <div />
                  <button onClick={() => nudge(0, -STEP)} className="flex items-center justify-center h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"><ChevronUp className="w-4 h-4 text-slate-600" /></button>
                  <div />
                  <button onClick={() => nudge(-STEP, 0)} className="flex items-center justify-center h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                  <div className="flex items-center justify-center h-9 rounded-xl bg-slate-50 text-[9px] font-bold text-slate-400 text-center leading-tight">
                    {logoOffsetX === 0 && logoOffsetY === 0 ? '·' : `${logoOffsetX > 0 ? '+' : ''}${logoOffsetX},${logoOffsetY > 0 ? '+' : ''}${logoOffsetY}`}
                  </div>
                  <button onClick={() => nudge(STEP, 0)} className="flex items-center justify-center h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                  <div />
                  <button onClick={() => nudge(0, STEP)} className="flex items-center justify-center h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"><ChevronDown className="w-4 h-4 text-slate-600" /></button>
                  <div />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50">
              <label className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary hover:bg-primary/5 cursor-pointer text-xs font-black uppercase tracking-tight transition-all">
                <ImageIcon className="w-5 h-5" />
                Cambia Immagine
                <input type="file" className="hidden" accept={ACCEPT_STRING} onChange={handleFileChange} />
              </label>
            </div>

            <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl p-3">
              <span className="text-base leading-none mt-0.5">💡</span>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                <span className="font-bold">Il logo non si vede bene nel PDF?</span>{' '}
                Prova a regolare lo zoom, tagliare o aumentare i bordi con gli appositi slider. Per risultati migliori usa un&apos;immagine con sfondo trasparente (PNG). Per rimuovere lo sfondo puoi usare strumenti gratuiti come{' '}
                <span className="font-semibold">remove.bg</span> o{' '}
                <span className="font-semibold">Canva</span>.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-200 border-dashed rounded-[2.5rem] cursor-pointer bg-slate-50/50 hover:bg-primary/5 hover:border-primary/30 transition-all group shadow-inner">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-slate-900 font-black uppercase tracking-tight">Carica il tuo Logo</p>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Formato PNG, JPG, HEIF, WEBP o SVG · max 6MB</p>
          <input type="file" className="hidden" accept={ACCEPT_STRING} onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}
