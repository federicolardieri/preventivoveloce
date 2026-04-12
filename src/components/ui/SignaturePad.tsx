"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Eraser, PenTool } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Resize canvas to match container width (retina-aware)
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Save current drawing
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

    canvas.width = rect.width * dpr;
    canvas.height = 160 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = "160px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Restore drawing
    if (hasDrawn) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Set drawing style
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [hasDrawn]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const getPosition = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPosition(e);
    lastPos.current = pos;
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !lastPos.current) return;

    const pos = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
    if (!hasDrawn) setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;

    // Export signature
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onSignatureChange(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setHasDrawn(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#5c32e6]/15 border border-[#5c32e6]/20 flex items-center justify-center">
          <PenTool className="w-4 h-4 text-[#a78bfa]" />
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">Firma qui sotto</p>
          <p className="text-[11px] text-white/40">
            Usa il dito o il mouse per disegnare la tua firma
          </p>
        </div>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] overflow-hidden transition-colors"
        style={isDrawing ? { borderColor: "rgba(167, 139, 250, 0.4)" } : {}}
      >
        <canvas
          ref={canvasRef}
          className="touch-none cursor-crosshair w-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Placeholder text when empty */}
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/15 text-sm font-medium select-none">
              Disegna la tua firma qui
            </p>
          </div>
        )}

        {/* Baseline */}
        <div className="absolute bottom-10 left-6 right-6 border-b border-white/10 pointer-events-none" />
      </div>

      {/* Clear button */}
      {hasDrawn && (
        <button
          type="button"
          onClick={clearSignature}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors ml-1"
        >
          <Eraser className="w-3.5 h-3.5" />
          Cancella e rifirma
        </button>
      )}
    </div>
  );
}
