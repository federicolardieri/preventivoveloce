"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Loader2, FileText } from 'lucide-react';

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

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/firma/${token}`, { method: 'POST' });
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5c32e6]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <div className="inline-block bg-white p-2 rounded-2xl border border-white/10 shadow-xl shadow-white/5">
              <Image src="/logo.png" alt="Preventivo Veloce" width={140} height={36} className="h-8 w-auto px-1" />
            </div>
          </Link>
        </div>

        <div className="bg-[#111118]/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
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
                <h2 className="text-2xl font-black mb-2">Accettato!</h2>
                <p className="text-white/55 text-sm leading-relaxed mb-4">
                  Hai accettato il preventivo <strong className="text-white/80">{info?.quoteNumber}</strong>.
                </p>
                <p className="text-white/40 text-xs leading-relaxed">
                  Riceverai una email di conferma con il documento timbrato.
                  {info?.senderName && <> <strong className="text-white/60">{info.senderName}</strong> riceverà una notifica.</>}
                </p>
              </motion.div>
            )}

            {/* Schermata principale — in attesa di accettazione */}
            {!loading && !error && !accepted && info && (
              <motion.div key="main" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header doc */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#5c32e6]/15 border border-[#5c32e6]/20 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-[#a78bfa]" />
                  </div>
                  <div>
                    <p className="text-xs text-white/35 uppercase tracking-widest font-black mb-0.5">Preventivo</p>
                    <p className="text-lg font-black text-white leading-tight">{info.quoteNumber}</p>
                    <p className="text-sm text-white/45">da <strong className="text-white/65">{info.senderName}</strong></p>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-white/5 border border-white/8 rounded-2xl p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Destinatario</span>
                    <span className="text-white/80 font-semibold">{info.clientName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Validità</span>
                    <span className="text-white/80 font-semibold">{info.validityDays} giorni</span>
                  </div>
                </div>

                <p className="text-xs text-white/35 text-center leading-relaxed mb-6">
                  Il preventivo è allegato all'email che hai ricevuto.
                  Cliccando "Accetto" confermi di aver letto e approvato il documento.
                  L'accettazione sarà registrata con data, ora e indirizzo IP.
                </p>

                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full h-14 rounded-xl bg-[#5c32e6] text-white font-extrabold text-base hover:bg-[#4f2bcc] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-[#5c32e6]/25"
                >
                  {accepting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {accepting ? 'Registrazione…' : 'Accetto il preventivo'}
                </button>
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
