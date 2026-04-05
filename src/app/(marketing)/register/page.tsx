"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Sparkles, ChevronLeft, CheckCircle2, RefreshCw } from 'lucide-react';

const RESEND_COOLDOWN = 60;

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    const supabase = createClient();
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/welcome?type=register')}`,
      },
    });
    setResendLoading(false);
    setResendSuccess(true);
    setResendCooldown(RESEND_COOLDOWN);
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return 'La password deve essere di almeno 6 caratteri.';
    if (!/[a-z]/.test(pwd)) return 'La password deve contenere almeno una lettera minuscola.';
    if (!/[A-Z]/.test(pwd)) return 'La password deve contenere almeno una lettera maiuscola.';
    if (!/[0-9]/.test(pwd)) return 'La password deve contenere almeno un numero.';
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/welcome?type=register')}`,
      },
    });

    if (error) {
      console.error('[register] Supabase error:', error.message);
      setError(error.message === 'User already registered'
        ? 'Email già registrata. Prova ad accedere.'
        : 'Errore durante la registrazione. Riprova.');
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/welcome?type=register')}` 
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5c32e6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center relative z-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-8 shadow-2xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-4">Controlla la tua email</h1>
          <p className="text-white/50 text-base leading-relaxed mb-8">
            Ti abbiamo inviato un link di conferma a <br />
            <strong className="text-white font-bold">{email}</strong>.<br />
            Clicca sul link per attivare il tuo account.
          </p>

          {/* Resend */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <p className="text-white/40 text-sm mb-3">Non hai ricevuto l'email?</p>
            {resendSuccess && (
              <p className="text-emerald-400 text-xs font-bold mb-3">Email inviata di nuovo! Controlla anche la cartella spam.</p>
            )}
            <button
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5c32e6]/20 border border-[#5c32e6]/30 text-[#a78bfa] text-sm font-bold hover:bg-[#5c32e6]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
              {resendCooldown > 0
                ? `Reinvia tra ${resendCooldown}s`
                : 'Reinvia email di conferma'
              }
            </button>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Torna al login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements to match landing page */}
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
          <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors mb-8 text-sm font-medium group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Torna alla Home
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
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">Crea il tuo account</h1>
            <p className="text-white/45 mt-2 font-medium">Gratis per sempre, nessuna carta richiesta</p>
          </div>

          {/* Card */}
          <div className="bg-[#111118]/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden">
            {/* Subtle glow inside card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5c32e6]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              {/* Google OAuth */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mb-6 shadow-lg shadow-white/5"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Registrati con Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] text-white/20 uppercase font-black tracking-[0.2em]">
                  <span className="bg-[#111118] px-4">oppure</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">
                    Nome e Cognome
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Mario Rossi"
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#5c32e6] focus:ring-4 focus:ring-[#5c32e6]/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@esempio.com"
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#5c32e6] focus:ring-4 focus:ring-[#5c32e6]/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min. 6 car., maiusc., numero"
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#5c32e6] focus:ring-4 focus:ring-[#5c32e6]/10 transition-all"
                  />
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
                  className="w-full h-12 rounded-xl bg-[#5c32e6] text-white font-extrabold text-sm hover:bg-[#4f2bcc] transition-all activity:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-xl shadow-[#5c32e6]/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Crea Account Gratis
                </button>
              </form>

              <p className="text-center text-[10px] text-white/30 mt-6 leading-relaxed font-medium">
                Registrandoti accetti i <Link href="/termini" className="text-white/50 hover:text-white underline">Termini di Servizio</Link> e la <Link href="/privacy-policy" className="text-white/50 hover:text-white underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>

          {/* Footer link */}
          <div className="mt-8 text-center bg-white/5 border border-white/10 rounded-2xl py-4 px-6">
            <p className="text-sm text-white/40 font-medium">
              Hai già un account?{' '}
              <Link href="/login" className="text-[#a78bfa] hover:text-white font-bold transition-colors underline underline-offset-4 decoration-[#a78bfa]/30 hover:decoration-white">
                Accedi qui →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
