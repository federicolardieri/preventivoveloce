"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, CheckCircle2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const isLogin = searchParams.get("type") === "login";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements to match overall theme */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#5c32e6]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="w-full max-w-2xl relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Logo Badge */}
          <div className="inline-block bg-white p-3 rounded-[2rem] shadow-2xl shadow-white/5 border border-white/10 mb-4 animate-bounce-slow">
            <Image 
              src="/logo.png" 
              alt="Preventivo Veloce" 
              width={180} 
              height={40} 
              className="h-10 w-auto px-2"
            />
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black tracking-widest uppercase mb-6">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isLogin ? "Log-in effettuato con successo" : "Registrazione Completata"}
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
                {isLogin ? "Bentornato," : "Benvenuto a bordo,"} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5c32e6] via-[#a78bfa] to-blue-400 animate-gradient-x">
                  {isLogin ? "ti stavamo aspettando." : "il tuo business vola."}
                </span>
              </h1>
              <p className="text-white/50 text-xl font-medium max-w-lg mx-auto leading-relaxed">
                {isLogin 
                  ? "Accesso eseguito correttamente. Carichiamo i tuoi dati e ti portiamo subito alla Dashboard."
                  : "Il tuo account è pronto. Ora puoi creare preventivi professionali in meno di 20 secondi con l'aiuto dell'intelligenza artificiale."}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-[#5c32e6] hover:bg-[#4b27cb] text-white font-black text-xl shadow-2xl shadow-[#5c32e6]/30 transition-all hover:scale-105 group">
                Vai alla Dashboard
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16"
          >
            {[
              { icon: Sparkles, title: "Assistente AI", desc: "Compila i dati scrivendo in chat" },
              { icon: PartyPopper, title: "Template Pro", desc: "Design di alta gamma per i tuoi PDF" },
              { icon: CheckCircle2, title: "Dati Sicuri", desc: "Backup automatico su cloud" },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 text-left hover:bg-white/[0.05] transition-colors">
                <item.icon className="w-8 h-8 text-[#a78bfa] mb-4" />
                <h4 className="font-bold text-white mb-1">{item.title}</h4>
                <p className="text-white/40 text-sm leading-snug">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <WelcomeContent />
    </Suspense>
  );
}
