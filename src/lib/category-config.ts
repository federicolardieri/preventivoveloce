import {
  HardHat, Code2, Palette, Briefcase, Wrench, Zap, Camera, TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CategoryBenefit {
  title: string;
  description: string;
}

export interface CategoryExampleItem {
  description: string;
  quantity: number;
  unitPrice: number; // in centesimi
  vatRate: number;
}

export interface CategoryConfig {
  slug: string;
  title: string;
  headline: string;
  description: string;
  icon: LucideIcon;
  color: string;
  colorMuted: string;
  exampleItems: CategoryExampleItem[];
  benefits: CategoryBenefit[];
  metadata: {
    title: string;
    description: string;
  };
}

export const categories: CategoryConfig[] = [
  {
    slug: 'preventivo-edilizia',
    title: 'Edilizia',
    headline: 'Preventivi per lavori edili in 20 secondi',
    description: 'Smetti di perdere clienti mentre compili fogli Excel. Genera preventivi professionali per ristrutturazioni, muratura e impiantistica in meno di un minuto.',
    icon: HardHat,
    color: '#f59e0b',
    colorMuted: 'rgba(245,158,11,0.12)',
    exampleItems: [
      { description: "Mano d'opera muratura", quantity: 8, unitPrice: 450000, vatRate: 22 },
      { description: 'Materiali da costruzione', quantity: 1, unitPrice: 180000, vatRate: 22 },
      { description: 'Smaltimento macerie', quantity: 1, unitPrice: 35000, vatRate: 22 },
      { description: 'Fornitura e posa piastrelle', quantity: 30, unitPrice: 2800, vatRate: 22 },
    ],
    benefits: [
      { title: 'IVA edilizia automatica', description: "Calcolo automatico dell'IVA al 10% per ristrutturazioni e al 22% per nuove costruzioni. Zero errori." },
      { title: 'PDF da cantiere', description: 'Genera il PDF dal telefono direttamente in cantiere. Il cliente lo riceve via email in 20 secondi.' },
      { title: 'Storico lavori', description: 'Tutti i preventivi per cantiere in un unico posto. Filtra per cliente, stato e importo.' },
    ],
    metadata: {
      title: 'Preventivo Edilizia Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per lavori edili, ristrutturazioni e muratura in 20 secondi con AI. PDF con logo, IVA automatica. Gratis.',
    },
  },
  {
    slug: 'preventivo-sviluppo-web',
    title: 'Sviluppo Web',
    headline: 'Preventivi per progetti web in 20 secondi',
    description: 'Smetti di perdere ore a formattare preventivi in Word. Descrivi il progetto in italiano, l\'AI genera voci, ore e totali — tu mandi al cliente.',
    icon: Code2,
    color: '#6366f1',
    colorMuted: 'rgba(99,102,241,0.12)',
    exampleItems: [
      { description: 'Sviluppo frontend React', quantity: 40, unitPrice: 7500, vatRate: 22 },
      { description: 'Backend API Node.js', quantity: 20, unitPrice: 8000, vatRate: 22 },
      { description: 'Design UI/UX', quantity: 10, unitPrice: 6500, vatRate: 22 },
      { description: 'Deploy e configurazione server', quantity: 1, unitPrice: 50000, vatRate: 22 },
    ],
    benefits: [
      { title: 'Voci tecniche precompilate', description: "L'AI conosce i termini del settore: frontend, backend, API, deployment. Niente traduzione manuale." },
      { title: 'Accettazione digitale', description: 'Il cliente accetta il preventivo con un click dall\'email. Nessuna firma cartacea.' },
      { title: 'Template professional', description: 'Layout moderno e pulito che trasmette professionalità — esattamente quello che un cliente tech si aspetta.' },
    ],
    metadata: {
      title: 'Preventivo Sviluppo Web Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per progetti web, app e e-commerce in 20 secondi con AI. PDF con logo, IVA automatica. Gratis.',
    },
  },
  {
    slug: 'preventivo-design',
    title: 'Grafico & Design',
    headline: 'Preventivi per progetti grafici in 20 secondi',
    description: 'Il tuo lavoro è visivo — anche il preventivo deve esserlo. Template eleganti, colori brand, PDF che il cliente non butterà via.',
    icon: Palette,
    color: '#ec4899',
    colorMuted: 'rgba(236,72,153,0.12)',
    exampleItems: [
      { description: 'Progettazione logo e brand identity', quantity: 1, unitPrice: 120000, vatRate: 22 },
      { description: 'Materiale stampa (biglietti, brochure)', quantity: 1, unitPrice: 60000, vatRate: 22 },
      { description: 'Social media kit (12 template)', quantity: 1, unitPrice: 45000, vatRate: 22 },
      { description: 'Revisioni incluse', quantity: 3, unitPrice: 0, vatRate: 22 },
    ],
    benefits: [
      { title: 'PDF che riflette il tuo stile', description: "8 template premium con colori personalizzabili. Il preventivo è già un'anteprima del tuo lavoro." },
      { title: 'Logo tuo in evidenza', description: 'Il tuo logo in alto, grande. Il cliente sa subito con chi sta parlando.' },
      { title: 'Prezzi flessibili', description: 'Pacchetti, ore, voci fisse o variabili. Ogni struttura tariffaria è supportata.' },
    ],
    metadata: {
      title: 'Preventivo Grafico e Design Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per logo, brand identity e grafica in 20 secondi con AI. PDF elegante con logo. Gratis.',
    },
  },
  {
    slug: 'preventivo-consulenza',
    title: 'Consulenza',
    headline: 'Preventivi per servizi di consulenza in 20 secondi',
    description: 'I tuoi clienti si aspettano precisione. Un preventivo chiaro, professionale e senza errori è il primo segnale che sai il fatto tuo.',
    icon: Briefcase,
    color: '#0ea5e9',
    colorMuted: 'rgba(14,165,233,0.12)',
    exampleItems: [
      { description: 'Analisi e diagnosi aziendale', quantity: 8, unitPrice: 15000, vatRate: 22 },
      { description: 'Piano strategico documentato', quantity: 1, unitPrice: 200000, vatRate: 22 },
      { description: 'Sessioni di follow-up (mensili)', quantity: 4, unitPrice: 30000, vatRate: 22 },
    ],
    benefits: [
      { title: 'Termini di pagamento chiari', description: 'Aggiungi condizioni di pagamento, IBAN e note contrattuali direttamente nel PDF.' },
      { title: 'Tracciamento stato', description: 'Bozza, inviato, accettato, rifiutato. Sai sempre dove si trova ogni proposta.' },
      { title: 'Storico per cliente', description: 'Rubrica clienti integrata. Tutti i preventivi per ciascun cliente in un click.' },
    ],
    metadata: {
      title: 'Preventivo Consulenza Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per servizi di consulenza aziendale e strategica in 20 secondi con AI. PDF professionale. Gratis.',
    },
  },
  {
    slug: 'preventivo-idraulico',
    title: 'Idraulico',
    headline: 'Preventivi per lavori idraulici in 20 secondi',
    description: 'Sei sul cantiere, non in ufficio. Genera il preventivo dal telefono in 20 secondi e mandalo al cliente prima che chiami il tuo concorrente.',
    icon: Wrench,
    color: '#06b6d4',
    colorMuted: 'rgba(6,182,212,0.12)',
    exampleItems: [
      { description: 'Sostituzione impianto idrico bagno', quantity: 1, unitPrice: 85000, vatRate: 22 },
      { description: "Mano d'opera", quantity: 6, unitPrice: 5500, vatRate: 22 },
      { description: 'Materiali e raccorderia', quantity: 1, unitPrice: 32000, vatRate: 22 },
      { description: 'Intervento urgenza (tariffa notturna)', quantity: 1, unitPrice: 18000, vatRate: 22 },
    ],
    benefits: [
      { title: 'Dal telefono in 20 secondi', description: "App web ottimizzata per mobile. Descrivi il lavoro a voce, l'AI compila il preventivo." },
      { title: 'Prezzi materiali separati', description: 'Voce manodopera + voce materiali sempre separati e chiari per il cliente.' },
      { title: 'IVA al 10% con un click', description: 'Manutenzione straordinaria? Imposti l\'IVA ridotta in un secondo.' },
    ],
    metadata: {
      title: 'Preventivo Idraulico Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per lavori idraulici e impianti in 20 secondi con AI. PDF dal cellulare. Gratis.',
    },
  },
  {
    slug: 'preventivo-elettricista',
    title: 'Elettricista',
    headline: 'Preventivi per lavori elettrici in 20 secondi',
    description: 'Meno tempo a scrivere, più tempo a lavorare. Il preventivo parte dall\'impianto — non dal PC.',
    icon: Zap,
    color: '#eab308',
    colorMuted: 'rgba(234,179,8,0.12)',
    exampleItems: [
      { description: 'Rifacimento impianto elettrico civile', quantity: 1, unitPrice: 180000, vatRate: 22 },
      { description: 'Installazione quadro elettrico', quantity: 1, unitPrice: 65000, vatRate: 22 },
      { description: "Mano d'opera", quantity: 12, unitPrice: 5000, vatRate: 22 },
      { description: 'Certificazione impianto', quantity: 1, unitPrice: 25000, vatRate: 22 },
    ],
    benefits: [
      { title: 'Genera da cantiere', description: "Apri dal telefono, descrivi l'impianto, invia il PDF. Il cliente risponde prima che tu salga sull'autocarro." },
      { title: 'Voci standard precompilate', description: 'Manodopera, materiali, certificazioni, urgenze. L\'AI sa già come strutturare un preventivo elettrico.' },
      { title: 'Nessun errore di calcolo', description: 'IVA, sconti e totale calcolati al centesimo. Mai più imbarazzi con il cliente.' },
    ],
    metadata: {
      title: 'Preventivo Elettricista Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per lavori elettrici e impianti in 20 secondi con AI. PDF dal cellulare. Gratis.',
    },
  },
  {
    slug: 'preventivo-fotografo',
    title: 'Fotografo',
    headline: 'Preventivi per servizi fotografici in 20 secondi',
    description: 'Le tue foto sono perfette. Il preventivo dovrebbe esserlo altrettanto. Template eleganti, PDF professionale, accettazione digitale.',
    icon: Camera,
    color: '#8b5cf6',
    colorMuted: 'rgba(139,92,246,0.12)',
    exampleItems: [
      { description: 'Servizio fotografico aziendale (mezza giornata)', quantity: 1, unitPrice: 90000, vatRate: 22 },
      { description: 'Post-produzione e ritocco (50 foto)', quantity: 1, unitPrice: 40000, vatRate: 22 },
      { description: 'Consegna file alta risoluzione', quantity: 1, unitPrice: 0, vatRate: 22 },
      { description: "Diritti d'uso commerciale", quantity: 1, unitPrice: 30000, vatRate: 22 },
    ],
    benefits: [
      { title: 'PDF visivamente curato', description: '8 template eleganti che comunicano estetica e cura — esattamente come le tue foto.' },
      { title: "Diritti d'uso nel preventivo", description: "Aggiungi clausole su diritti d'uso, licenze e consegne direttamente nelle note del PDF." },
      { title: 'Accettazione digitale', description: 'Il cliente firma il preventivo con un click dall\'email. Nessun documento cartaceo.' },
    ],
    metadata: {
      title: 'Preventivo Fotografo Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per servizi fotografici e video in 20 secondi con AI. PDF elegante con logo. Gratis.',
    },
  },
  {
    slug: 'preventivo-marketing',
    title: 'Marketing Digitale',
    headline: 'Preventivi per servizi marketing in 20 secondi',
    description: 'Vendi strategie digitali — il tuo processo dovrebbe riflettere la tua competenza. Un preventivo generato con AI in 20 secondi dice tutto.',
    icon: TrendingUp,
    color: '#10b981',
    colorMuted: 'rgba(16,185,129,0.12)',
    exampleItems: [
      { description: 'Gestione campagne Google Ads (mensile)', quantity: 3, unitPrice: 80000, vatRate: 22 },
      { description: 'Strategia e content social media', quantity: 3, unitPrice: 60000, vatRate: 22 },
      { description: 'SEO on-page + audit', quantity: 1, unitPrice: 120000, vatRate: 22 },
      { description: 'Report mensile analytics', quantity: 3, unitPrice: 15000, vatRate: 22 },
    ],
    benefits: [
      { title: 'Struttura per pacchetti', description: 'Setup, gestione mensile, report. Ogni pacchetto come voce separata con IVA corretta.' },
      { title: 'Invio tracciato via email', description: 'Sai quando il cliente apre il preventivo. Sai quando lo accetta. Sei sempre un passo avanti.' },
      { title: 'Aspetto da agenzia', description: 'Template Executive o Corporate per proporre prezzi premium con la credibilità che meritano.' },
    ],
    metadata: {
      title: 'Preventivo Marketing Digitale Gratis | Preventivo Veloce',
      description: 'Crea preventivi professionali per servizi marketing digitale, SEO e social media in 20 secondi con AI. Gratis.',
    },
  },
];

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return categories.find((c) => c.slug === slug);
}
