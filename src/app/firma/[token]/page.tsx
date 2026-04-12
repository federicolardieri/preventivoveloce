"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Loader2, FileText, PenTool } from 'lucide-react';
import { SignaturePad } from '@/components/ui/SignaturePad';

interface QuoteInfo {
  quoteNumber: string;
  clientName: string;
  senderName: string;
  validityDays: number;
  alreadyAccepted: boolean;
  acceptedAt: string | null;
}

export default function FirmaPage() {
  const params = useParams();
  const token = params.token as string;

  const [info, setInfo] = useState<QuoteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [wantsToSign, setWantsToSign] = useState(false);

  useEffect(() => {
    fetch(`/api/firma/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 410) setError('link_expired');
          else setError(body.error || 'Link non valido');
          return;
        }
        const data = await res.json();
        setInfo(data);
        if (data.alreadyAccepted) setAccepted(true);
      })
      .catch(() => setError('Errore di rete. Riprova.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (withSignature: boolean) => {
    if (withSignature && !signatureData) return;
    setAccepting(true);
    try {
      const res = await fetch(`/api/firma/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withSignature && signatureData ? { signatureData } : {}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Errore durante l\'accettazione');
        return;
      }
      setAccepted(true);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setAccepting(false);
    }
  };

  const didSign = wantsToSign && signatureData;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5c32e6]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[520px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 sm:mb-10">
          <Link href="/" className="inline-block">
            <div className="inline-block bg-white p-2 rounded-2xl border border-white/10 shadow-xl shadow-white/5">
              <Image src="/logo.png" alt="Preventivo Veloce" width={140} height={36} className="h-7 sm:h-8 w-auto px-1" />
            </div>
          </Link>
        </div>

        <div className="bg-[#111118]/60 border border-white/10 rounded-3xl p-5 sm:p-8 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
          <AnimatePresence mode="wait">

            {/* Loading */}
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                <Loader2 className="w-10 h-10 text-[#a78bfa] animate-spin mx-auto mb-4" />
                <p className="text-white/50 text-sm">Caricamento preventivo…</p>
              </motion.div>
            )}

            {/* Errore link scaduto */}
            {!loading && error === 'link_expired' && (
              <motion.div key="expired" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-black mb-2">Link scaduto</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Questo link non è più valido. Contatta chi ti ha inviato il preventivo per richiederne uno nuovo.
                </p>
              </motion.div>
            )}

            {/* Errore generico */}
            {!loading && error && error !== 'link_expired' && (
              <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6">
                  <AlertTriangle className="w-8 h-8 text-rose-400" />
                </div>
                <h2 className="text-xl font-black mb-2">Link non valido</h2>
                <p className="text-white/50 text-sm leading-relaxed">{error}</p>
              </motion.div>
            )}

            {/* Già accettato */}
            {!loading && !error && accepted && info?.alreadyAccepted && (
              <motion.div key="already" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-black mb-2">Già accettato</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Hai già accettato questo preventivo. Controlla la tua email per il documento con il timbro di accettazione.
                </p>
              </motion.div>
            )}

            {/* Accettazione appena avvenuta */}
            {!loading && !error && accepted && !info?.alreadyAccepted && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-black mb-2">
                  {didSign ? 'Accettato e Firmato!' : 'Accettato!'}
                </h2>
                <p className="text-white/55 text-sm leading-relaxed mb-4">
                  Hai accettato il preventivo <strong className="text-white/80">{info?.quoteNumber}</strong>.
                </p>
                <p className="text-white/40 text-xs leading-relaxed">
                  Riceverai una email di conferma con il documento timbrato{didSign ? ' e la tua firma' : ''}.
                  {info?.senderName && <> <strong className="text-white/60">{info.senderName}</strong> riceverà una notifica.</>}
                </p>
              </motion.div>
            )}

            {/* Schermata principale — in attesa di accettazione */}
            {!loading && !error && !accepted && info && (
              <motion.div key="main" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header doc */}
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#5c32e6]/15 border border-[#5c32e6]/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#a78bfa]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-white/35 uppercase tracking-widest font-black mb-0.5">Preventivo</p>
                    <p className="text-base sm:text-lg font-black text-white leading-tight truncate">{info.quoteNumber}</p>
                    <p className="text-xs sm:text-sm text-white/45">da <strong className="text-white/65">{info.senderName}</strong></p>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-white/5 border border-white/8 rounded-2xl p-3 sm:p-4 mb-5 sm:mb-6 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-white/40">Destinatario</span>
                    <span className="text-white/80 font-semibold truncate ml-4">{info.clientName}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-white/40">Validità</span>
                    <span className="text-white/80 font-semibold">{info.validityDays} giorni</span>
                  </div>
                </div>

                {/* Signature toggle */}
                {!wantsToSign ? (
                  <div className="mb-5 sm:mb-6">
                    <button
                      type="button"
                      onClick={() => setWantsToSign(true)}
                      className="w-full flex items-center gap-3 bg-white/[0.03] border border-dashed border-white/10 rounded-2xl p-4 hover:border-[#5c32e6]/30 hover:bg-[#5c32e6]/[0.03] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#5c32e6]/10 border border-[#5c32e6]/15 flex items-center justify-center shrink-0 group-hover:bg-[#5c32e6]/15 transition-colors">
                        <PenTool className="w-5 h-5 text-[#a78bfa]" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white/70 group-hover:text-white/90 transition-colors">Vuoi firmare il preventivo?</p>
                        <p className="text-[11px] text-white/35">Opzionale — clicca per aggiungere la firma autografa al documento</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mb-5 sm:mb-6"
                  >
                    <SignaturePad onSignatureChange={setSignatureData} />
                    <button
                      type="button"
                      onClick={() => { setWantsToSign(false); setSignatureData(null); }}
                      className="mt-2 text-[11px] text-white/30 hover:text-white/50 transition-colors"
                    >
                      ← Procedi senza firma
                    </button>
                  </motion.div>
                )}

                <p className="text-[10px] sm:text-xs text-white/30 text-center leading-relaxed mb-5 sm:mb-6">
                  Il preventivo è allegato all&apos;email che hai ricevuto.
                  Cliccando il pulsante confermi di aver letto e approvato il documento.
                  L&apos;accettazione sarà registrata con data, ora{wantsToSign && signatureData ? ', firma' : ''} e indirizzo IP.
                </p>

                {/* CTAs */}
                {wantsToSign ? (
                  /* Firma + Accetta */
                  <button
                    onClick={() => handleAccept(true)}
                    disabled={accepting || !signatureData}
                    className={`w-full h-14 rounded-xl font-extrabold text-sm sm:text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl ${
                      signatureData
                        ? 'bg-[#5c32e6] text-white hover:bg-[#4f2bcc] shadow-[#5c32e6]/25'
                        : 'bg-white/5 text-white/25 cursor-not-allowed shadow-none border border-white/10'
                    }`}
                  >
                    {accepting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <PenTool className="w-5 h-5" />
                    )}
                    {accepting ? 'Registrazione…' : signatureData ? 'Accetta e Firma' : 'Firma sopra per procedere'}
                  </button>
                ) : (
                  /* Solo Accetta */
                  <button
                    onClick={() => handleAccept(false)}
                    disabled={accepting}
                    className="w-full h-14 rounded-xl bg-[#5c32e6] text-white font-extrabold text-sm sm:text-base hover:bg-[#4f2bcc] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-[#5c32e6]/25"
                  >
                    {accepting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {accepting ? 'Registrazione…' : 'Accetto il preventivo'}
                  </button>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Powered by <Link href="/" className="hover:text-white/50 transition-colors">Preventivo Veloce</Link>
        </p>
      </div>
    </div>
  );
}
