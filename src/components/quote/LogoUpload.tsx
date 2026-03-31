"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useQuoteStore } from "@/store/quoteStore";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Trash2, Maximize2, Circle, Square, Image as FullImage, ZoomIn, ZoomOut, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Crosshair } from "lucide-react";
import { LogoShape } from "@/types/quote";

// ── Utility: estrae area croppata e restituisce dataURL ───────────────
function getCroppedDataUrl(imageSrc: string, cropArea: Area, size = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        image,
        cropArea.x, cropArea.y,
        cropArea.width, cropArea.height,
        0, 0, size, size,
      );
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

export function LogoUpload() {
  const { currentQuote, updateSender, updateTheme } = useQuoteStore();

  // ── Crop modal state ─────────────────────────────────────────────────
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const croppedAreaPixelsRef = useRef<Area | null>(null);

  if (!currentQuote) return null;

  const { theme, sender } = currentQuote;
  const logoShape = theme.logoShape || 'original';
  const logoScale = theme.logoScale || 1;
  const logoOffsetX = theme.logoOffsetX ?? 0;
  const logoOffsetY = theme.logoOffsetY ?? 0;
  const logoOriginal = sender.logoOriginal;

  const STEP = 4; // pt per click
  const nudge = (dx: number, dy: number) => {
    updateTheme({
      logoOffsetX: logoOffsetX + dx,
      logoOffsetY: logoOffsetY + dy,
    });
  };

  const processLogo = useCallback(async (
    original: string,
    shape: LogoShape,
    scale: number
  ) => {
    return new Promise<void>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(); return; }

        const BASE = 400;

        if (shape === 'original') {
          const w = img.width * scale;
          const h = img.height * scale;
          const ratio = Math.min(1200 / w, 1200 / h, 1);
          canvas.width = w * ratio;
          canvas.height = h * ratio;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
          const containerSize = BASE;
          canvas.width = containerSize;
          canvas.height = containerSize;

          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.save();
          if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(containerSize / 2, containerSize / 2, containerSize / 2, 0, Math.PI * 2);
            ctx.clip();
          } else if (shape === 'square') {
            const radius = 60;
            ctx.beginPath();
            // @ts-ignore
            if (ctx.roundRect) {
              // @ts-ignore
              ctx.roundRect(0, 0, containerSize, containerSize, radius);
            } else {
              ctx.rect(0, 0, containerSize, containerSize);
            }
            ctx.clip();
          }

          const drawSize = containerSize * scale;
          const offset = (containerSize - drawSize) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, offset, offset, drawSize, drawSize);
          ctx.restore();
        }

        const processed = canvas.toDataURL("image/png");
        updateSender({ logo: processed });
        resolve();
      };
      img.src = original;
    });
  }, [updateSender]);

  useEffect(() => {
    if (logoOriginal) {
      processLogo(logoOriginal, logoShape, logoScale);
    }
  }, [logoOriginal, logoShape, logoScale, processLogo]);

  // Apre il modal di crop quando l'utente seleziona un file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 6 * 1024 * 1024) {
      alert("Il file è troppo grande. Il limite massimo è 6MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // Conferma il crop ed imposta logoOriginal
  const handleCropConfirm = async () => {
    const pixels = croppedAreaPixelsRef.current;
    if (!cropSrc || !pixels) return;
    const src = cropSrc;
    setCropSrc(null);
    try {
      const dataUrl = await getCroppedDataUrl(src, pixels, 800);
      URL.revokeObjectURL(src);
      updateSender({ logoOriginal: dataUrl });
      updateTheme({ logoScale: 1 });
    } catch {
      URL.revokeObjectURL(src);
      alert("Errore durante il ritaglio dell'immagine.");
    }
  };

  const handleCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  return (
    <>
      {/* ── Modal Crop Logo ─────────────────────────────────────────── */}
      {cropSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Ritaglia il logo</h3>
              <button onClick={handleCancel} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="px-6 pb-2 text-xs text-muted-foreground">
              Trascina per posizionare · Usa lo slider per zoomare
            </p>

            {/* Area crop */}
            <div className="relative w-full bg-black" style={{ height: 320 }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                minZoom={0.2}
                maxZoom={5}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_: Area, pixels: Area) => {
                  croppedAreaPixelsRef.current = pixels;
                }}
                style={{
                  cropAreaStyle: {
                    border: '3px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                  },
                }}
              />
            </div>

            {/* Zoom slider */}
            <div className="px-6 pt-4 flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="range" min={0.2} max={5} step={0.01} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>

            <div className="px-6 py-4 flex gap-3">
              <Button variant="outline" onClick={handleCancel} className="flex-1 rounded-xl h-11 font-bold">
                Annulla
              </Button>
              <Button onClick={handleCropConfirm} className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-11 font-bold">
                Usa questo logo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main UI ─────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <Label className="text-sm font-black text-slate-900 uppercase tracking-tight">Logo Aziendale</Label>

        {logoOriginal ? (
          <div className="space-y-6">
            {/* Preview */}
            <div className="relative w-full aspect-video rounded-3xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shadow-inner group">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

              <div
                className={`relative overflow-hidden flex items-center justify-center bg-white shadow-xl transition-all duration-500 border border-slate-200/50 ${
                  logoShape === 'circle' ? 'rounded-full aspect-square w-32' :
                  logoShape === 'square' ? 'rounded-2xl aspect-square w-32' :
                  'rounded-xl w-48 h-24'
                }`}
              >
                <img
                  src={logoOriginal}
                  alt="Logo Preview"
                  className="transition-transform duration-300 pointer-events-none"
                  style={{
                    transform: `scale(${logoScale})`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: logoShape === 'original' ? 'contain' : 'cover'
                  }}
                />
              </div>

              <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white text-red-500 rounded-full w-10 h-10 transition-transform hover:scale-110"
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
                    ] as { id: LogoShape; label: string; Icon: any }[]
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
              <div className="space-y-4 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dimensione / Zoom</span>
                  <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{Math.round(logoScale * 100)}%</span>
                </div>
                <div className="relative flex items-center gap-4">
                  <Maximize2 className="w-4 h-4 text-slate-300" />
                  <input
                    type="range"
                    min="0.4"
                    max="3.0"
                    step="0.1"
                    value={logoScale}
                    onChange={(e) => updateTheme({ logoScale: parseFloat(e.target.value) })}
                    className="w-full accent-primary h-1.5 bg-slate-100 rounded-full cursor-pointer appearance-none hover:bg-slate-200 transition-colors"
                  />
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
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-200 border-dashed rounded-[2.5rem] cursor-pointer bg-slate-50/50 hover:bg-primary/5 hover:border-primary/30 transition-all group shadow-inner">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-slate-900 font-black uppercase tracking-tight">Carica il tuo Logo</p>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Formato PNG, JPG o SVG raccomandato</p>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </>
  );
}
