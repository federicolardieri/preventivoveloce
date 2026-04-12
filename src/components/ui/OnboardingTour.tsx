'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, Palette, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { Button } from './button';

const STEPS = [
  {
    id: 'welcome',
    title: 'Benvenuto a bordo! 🎉',
    description: 'Hai appena sbloccato il modo più veloce per creare preventivi perfetti. Ti rubiamo solo 30 secondi per mostrarti come funziona la plancia di comando.',
    icon: Sparkles,
    color: 'text-[#5c32e6]',
    bg: 'bg-[#5c32e6]/10'
  },
  {
    id: 'tour-ai-btn',
    title: 'Magia dell\'AI ✨',
    description: 'Non hai voglia di scrivere o sei di fretta? Clicca qui e descrivi o detta il lavoro al nostro Assistente. Ci penserà lui a compilare tutto in 20 secondi.',
    icon: Sparkles,
    color: 'text-[#5c32e6]',
    bg: 'bg-[#5c32e6]/10'
  },
  {
    id: 'tour-manual-card',
    title: 'Compilazione Manuale 📝',
    description: 'Preferisci fare da solo? Usa il box sottostante e muoviti tra le tre schede (DATI, VOCI e RIEPILOGO) per avere il controllo completo, come sempre.',
    icon: FileText,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 'tour-preview',
    title: 'Design Personalizzato 🎨',
    description: 'Puoi personalizzare ogni aspetto visivo! Cerca la voce TEMPLATE per modificare Font, Colori e lo Stile Generale visibile nel documento finale.',
    icon: Palette,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  }
];

export function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = STEPS[currentStep];

  useEffect(() => {
    const updatePosition = () => {
      if (step.id === 'welcome' || step.id === 'tour-preview') {
        setTargetRect(null); 
        return;
      }
      const el = document.getElementById(step.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
        }, 300); 
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [step.id]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
    else onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4"
      >
        {targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1, 
              top: targetRect.top - 10,
              left: targetRect.left - 10,
              width: targetRect.width + 20,
              height: targetRect.height + 20
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute rounded-3xl border-4 border-[#5c32e6] pointer-events-none hidden lg:block" 
          />
        )}

        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="relative z-10 w-full max-w-[400px] bg-card rounded-3xl border border-border/50 shadow-[0_0_100px_-20px_rgba(92,50,230,0.4)] overflow-hidden"
          style={targetRect && window.innerWidth > 1024 ? {
            position: 'absolute',
            top: Math.max(20, targetRect.bottom + 20 > window.innerHeight - 300 ? targetRect.top - 280 : targetRect.bottom + 20),
            left: Math.max(20, Math.min(window.innerWidth - 420, targetRect.left + (targetRect.width / 2) - 200)),
          } : {}}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-muted">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#5c32e6] to-[#7c3aed]"
              initial={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${step.bg}`}>
                <step.icon className={`w-6 h-6 ${step.color}`} />
              </div>
              <button onClick={onComplete} className="text-muted-foreground hover:text-foreground transition-colors p-2 -mr-2 -mt-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-2xl font-black text-foreground mb-3 leading-tight tracking-tight">{step.title}</h3>
            <p className="text-muted-foreground text-[15px] font-medium leading-relaxed mb-8">
              {step.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-muted-foreground/50">
                Passo {currentStep + 1} di {STEPS.length}
              </div>
              <Button 
                onClick={handleNext}
                className="bg-[#5c32e6] hover:bg-[#4f2bcc] text-white font-bold rounded-xl shadow-lg shadow-[#5c32e6]/25 hover:-translate-y-0.5 transition-all min-w-[120px] h-11"
              >
                {currentStep === STEPS.length - 1 ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Inizia</>
                ) : (
                  <>Avanti <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
