"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Sparkles, ChevronLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!checkRes.ok) {
        setError('Errore durante la verifica. Riprova tra qualche secondo.');
        setLoading(false);
        return;
      }

      const { exists, confirmed } = await checkRes.json();

      if (!exists) {
        setError('Nessun account trovato con questa email.');
        setLoading(false);
        return;
      }

      if (!confirmed) {
        setError('Email non ancora verificata. Controlla la tua casella di posta e clicca il link di attivazione prima di reimpostare la password.');
        setLoading(false);
        return;
      }
    } catch {
      setError('Impossibile completare la verifica. Controlla la connessione e riprova.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5c32e6]/10 rounded-full blur-[120px] pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="w-full max-w-[440px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back button */}
          <Link href="/login" className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-8 text-sm font-medium group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Torna al Login
          </Link>

          <div className="text-center mb-10">
            <Link href="/" className="inline-block mb-8 group bg-white p-2 rounded-2xl shadow-2xl shadow-white/5 border border-white/10">
              <Image 
                src="/logo.png" 
                alt="Preventivo Veloce" 
                width={200} 
                height={50} 
                className="h-10 w-auto group-hover:scale-105 transition-transform px-2"
              />
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">Recupera Password</h1>
            <p className="text-white/45 mt-2 font-medium">Inserisci la tua email per ricevere un link di reset</p>
          </div>

          {/* Card */}
          <div className="bg-[#111118]/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5c32e6]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Email inviata!</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-8">
                    Controlla la tua casella di posta. Ti abbiamo inviato un link per reimpostare la tua password.
                  </p>
                  <Button
                    onClick={() => setSuccess(false)}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                  >
                    Riprova con un'altra email
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleResetRequest} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="tu@esempio.com"
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#5c32e6] focus:ring-4 focus:ring-[#5c32e6]/10 transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-bold text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-3"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[#5c32e6] text-white font-extrabold text-sm hover:bg-[#4f2bcc] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-[#5c32e6]/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Invia link di reset
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Simple Button component since I can't confirm availability of @/components/ui/button in this scope easily without listing
function Button({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-bold transition-all active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}
