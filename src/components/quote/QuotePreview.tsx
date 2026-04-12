"use client";

import { useQuoteStore } from "@/store/quoteStore";
import { useEffect, useState, useRef, useCallback } from "react";
import { FileScan, AlertCircle, ChevronLeft, ChevronRight, Lock, Zap } from "lucide-react";
import { PRO_TEMPLATES } from "@/types/quote";

export function QuotePreview({ 
  compact = false, 
  quotaBlocked = false,
  mode = 'edit'
}: { 
  compact?: boolean; 
  quotaBlocked?: boolean;
  mode?: 'edit' | 'view';
}) {
  const { currentQuote } = useQuoteStore();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | false>(false);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Render PDF pages to canvas images using pdfjs-dist
  const renderPdfToImages = useCallback(async (url: string) => {
    try {
      const pdfjsLib = await import("pdfjs-dist");

      // Set the worker source to local copy
      pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setTotalPages(pdf.numPages);

      const images: string[] = [];

      // Use lower scale on mobile to avoid iOS canvas memory limits
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      const scale = isMobile ? 1.5 : 2;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          console.error("Failed to get canvas context for page", pageNum);
          continue;
        }

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        // Use JPEG on mobile for lower memory footprint
        images.push(isMobile ? canvas.toDataURL("image/jpeg", 0.92) : canvas.toDataURL("image/png"));

        // Release canvas memory immediately
        canvas.width = 0;
        canvas.height = 0;
      }

      setPageImages(images);
      setCurrentPage(0);
    } catch (err) {
      console.error("PDF render error:", err);
      setError(err instanceof Error ? `Render: ${err.message}` : 'Errore rendering PDF');
    }
  }, []);

  // Fetch PDF from API (debounced) — non chiamare se quota bloccata
  useEffect(() => {
    if (!currentQuote || quotaBlocked) return;

    setLoading(true);
    setError(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      const fetchPdf = async (attempt: number): Promise<void> => {
        const response = await fetch("/api/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // _preview: true → il server salta il check quota e applica solo il watermark
          // _view: true → indica che siamo nella schermata di dettaglio, non nell'editor
          body: JSON.stringify({
            ...currentQuote,
            _preview: true,
            _view: mode === 'view'
          }),
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 1000));
            return fetchPdf(attempt + 1);
          }
          throw new Error(`PDF ${response.status}: ${errBody.slice(0, 200)}`);
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('PDF vuoto ricevuto dal server');
        }
        const url = URL.createObjectURL(blob);

        // Clean up previous blob URL
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);

        setPdfUrl(url);
        await renderPdfToImages(url);
      };

      try {
        await fetchPdf(0);
      } catch (err) {
        console.error('QuotePreview fetch error:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    }, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuote, mode, retryCount]);

  const goToPrevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  const isProPlan = useQuoteStore((state) => state.isProPlan);
  const isProTemplate = currentQuote && PRO_TEMPLATES.includes(currentQuote.template);
  const isLocked = isProTemplate && !isProPlan;

  // ── Upgrade wall ─────────────────────────────────────────────────────────
  if (quotaBlocked) {
    return (
      <div className="h-full w-full bg-[#1e1e1e] flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 bg-black/60 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl max-w-sm mx-4">
          <div className="w-20 h-20 rounded-3xl bg-[#5c32e6] flex items-center justify-center mb-6 shadow-xl shadow-[#5c32e6]/30">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-[#a78bfa] fill-current" />
            <h3 className="text-xl font-black text-white tracking-tight">Limite raggiunto</h3>
          </div>
          <p className="text-white/60 text-sm font-medium leading-relaxed mt-2">
            Hai già usato il tuo preventivo gratuito.
            Passa a Starter o Pro per crearne altri.
          </p>
          <a
            href="/impostazioni?tab=piano"
            className="mt-8 bg-[#5c32e6] hover:bg-[#4f2bcc] text-white font-black px-8 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#5c32e6]/30 inline-block"
          >
            Sblocca il piano →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#1e1e1e] flex flex-col transition-colors relative">
      {/* Blueprint/Desk Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div
        ref={containerRef}
        className={`flex-1 flex flex-col items-center justify-center relative w-full h-full overflow-hidden ${compact ? 'p-4' : 'p-8 lg:p-12'}`}
      >
        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-x-0 top-0 h-1 bg-primary/20 overflow-hidden z-20">
            <div className="h-full bg-primary animate-pulse w-1/3" />
          </div>
        )}

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-400 p-4 sm:p-8 text-center relative z-10">
            <AlertCircle className="w-10 h-10 sm:w-16 sm:h-16 mb-3 sm:mb-4 opacity-50" />
            <p className="font-bold text-base sm:text-lg">Errore Generazione PDF</p>
            <p className="text-xs sm:text-sm text-white/40 mt-2 max-w-[280px] break-words">
              {typeof error === 'string' ? error : 'Controlla i dati inseriti e riprova.'}
            </p>
            <button
              onClick={() => {
                setError(false);
                setPageImages([]);
                setPdfUrl(null);
                setRetryCount(c => c + 1);
              }}
              className="mt-4 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Riprova
            </button>
          </div>
        ) : pageImages.length > 0 ? (
          <>
            {/* A4 Document Image — scaled to fit the container */}
            <div className="flex-1 flex items-center justify-center w-full min-h-0 relative z-10">
              <div className={`relative group transition-all duration-500 ${isLocked ? 'grayscale-[0.3]' : 'hover:scale-[1.01]'}`}>
                {/* Paper Shadow Stack */}
                <div className="absolute inset-0 bg-black/40 blur-2xl translate-y-4 scale-95 opacity-50 transition-opacity" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pageImages[currentPage]}
                  alt={`Pagina ${currentPage + 1}`}
                  className={`max-w-full object-contain shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 transition-opacity duration-300 relative z-10 ${compact ? 'max-h-[68vh]' : 'max-h-[85vh]'}`}
                  style={{
                    opacity: loading ? 0.7 : 1,
                    aspectRatio: "210 / 297", // A4 ratio
                  }}
                  draggable={false}
                />
              </div>

              {/* PRO Lock Overlay */}
              {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl max-w-sm animate-in zoom-in duration-300">
                    <div className="w-20 h-20 rounded-3xl bg-amber-400 flex items-center justify-center mb-6 shadow-xl shadow-amber-400/20">
                      <Lock className="w-10 h-10 text-amber-950" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                       <Zap className="w-5 h-5 text-amber-400 fill-current" />
                       <h3 className="text-xl font-black text-white uppercase tracking-tight">Template PRO</h3>
                    </div>
                    <p className="text-white/60 text-sm font-medium leading-relaxed">
                      Sblocca il piano Pro per utilizzare questo template avanzato e salvare il tuo preventivo.
                    </p>
                    <button className="mt-8 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-8 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-400/20">
                      Passa a PRO
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Page navigation — only show if multi-page */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6 py-4 px-8 bg-black/40 backdrop-blur-md rounded-full mb-8 border border-white/10 relative z-20 shadow-2xl">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/5"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-widest font-black text-white/40 mb-0.5">Pagina</span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    {currentPage + 1} <span className="text-white/30 mx-1">/</span> {totalPages}
                  </span>
                </div>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/5"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 p-8 text-center relative z-10">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
              <FileScan className="w-10 h-10 opacity-50" />
            </div>
            <p className="font-black text-2xl text-white/60 tracking-tight">
              Anteprima in Diretta
            </p>
            <p className="text-sm mt-3 font-medium text-white/30 max-w-xs">
              Inserisci i dati a sinistra per comporre il tuo documento professionale.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
