import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termini e Condizioni — Preventivo Veloce',
  description: 'Termini e condizioni di utilizzo del servizio Preventivo Veloce.',
  robots: { index: false },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-base font-black text-white mb-3 pb-2 border-b border-white/8">{title}</h2>
    <div className="space-y-3 text-sm text-white/55 leading-relaxed">{children}</div>
  </section>
);

export default function TerminiPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Nav */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors mb-12 text-sm font-medium group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Torna alla Home
        </Link>

        {/* Logo */}
        <Link href="/" className="block mb-10">
          <div className="inline-block bg-white p-2 rounded-2xl border border-white/10">
            <Image src="/logo.png" alt="Preventivo Veloce" width={140} height={36} className="h-8 w-auto px-1" />
          </div>
        </Link>

        {/* Title */}
        <div className="mb-12">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Termini e Condizioni</h1>
          <p className="text-white/30 text-xs">Ultimo aggiornamento: marzo 2026</p>
        </div>

        {/* Sections */}
        <Section title="1. Accettazione dei Termini">
          <p>
            Utilizzando il servizio Preventivo Veloce ("Servizio") accetti integralmente i presenti Termini e Condizioni.
            Se non accetti, ti invitiamo a non utilizzare il Servizio. L'utilizzo continuato del Servizio dopo eventuali
            modifiche costituisce accettazione dei nuovi termini.
          </p>
        </Section>

        <Section title="2. Descrizione del Servizio">
          <p>
            Preventivo Veloce è un'applicazione web SaaS per la creazione, gestione e invio di preventivi commerciali.
            Include funzionalità di generazione PDF, assistente AI, rubrica clienti e storico preventivi.
          </p>
          <p>
            Ci riserviamo il diritto di modificare, sospendere o interrompere il Servizio in qualsiasi momento,
            senza responsabilità nei tuoi confronti.
          </p>
        </Section>

        <Section title="3. Registrazione e Account">
          <p>Per utilizzare il Servizio è necessario creare un account. Sei responsabile di:</p>
          <ul className="space-y-1.5 mt-2">
            {[
              'Fornire informazioni accurate e aggiornate durante la registrazione',
              'Mantenere la riservatezza delle credenziali di accesso',
              'Tutte le attività svolte tramite il tuo account',
              'Notificarci immediatamente in caso di accesso non autorizzato',
            ].map(item => (
              <li key={item} className="flex gap-2">
                <span className="text-[#a78bfa] mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="4. Piani e Pagamenti">
          <ul className="space-y-2 mb-3">
            {[
              ['Free', 'funzionalità di base con crediti limitati, senza scadenza'],
              ['Starter e Pro', 'piani a pagamento con crediti mensili e funzionalità avanzate'],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2">
                <span className="text-[#a78bfa] mt-0.5">·</span>
                <span><strong className="text-white/75">{label}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
          <p>
            I pagamenti sono elaborati tramite Stripe. I prezzi si intendono IVA inclusa.
            I piani si rinnovano automaticamente salvo disdetta prima della scadenza tramite il portale Stripe.
          </p>
          <p>
            I crediti non utilizzati non sono trasferibili né rimborsabili al termine del periodo di fatturazione.
          </p>
        </Section>

        <Section title="5. Diritto di Recesso">
          <p>
            Se sei un consumatore (persona fisica che agisce per scopi estranei all'attività professionale),
            hai diritto di recedere entro <strong className="text-white/80">14 giorni</strong> dalla sottoscrizione
            di un piano a pagamento, senza necessità di motivazione (D.Lgs. 206/2005, art. 52 e ss.).
          </p>
          <p>
            Per esercitare il recesso contatta:{' '}
            <a href="mailto:support@ilpreventivoveloce.it" className="text-[#a78bfa] hover:text-white transition-colors underline underline-offset-2">
              support@ilpreventivoveloce.it
            </a>
          </p>
        </Section>

        <Section title="6. Uso Accettabile">
          <p>È vietato utilizzare il Servizio per:</p>
          <ul className="space-y-1.5 mt-2">
            {[
              'Attività illegali, fraudolente o dannose per terzi',
              'Inviare spam o comunicazioni commerciali non sollecitate',
              'Caricare contenuti che violino diritti di proprietà intellettuale altrui',
              'Tentare di accedere a sistemi o dati non autorizzati',
              'Sovraccaricare intenzionalmente l\'infrastruttura del Servizio',
              'Rivendere o sublicenziare l\'accesso senza autorizzazione',
            ].map(item => (
              <li key={item} className="flex gap-2">
                <span className="text-[#a78bfa] mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="7. Proprietà Intellettuale">
          <p>
            Tutti i diritti relativi al Servizio (codice, design, marchi, testi) sono di proprietà di Preventivo Veloce.
            I contenuti da te inseriti (testi, dati, loghi) rimangono di tua proprietà; ci concedi una licenza limitata
            per elaborarli al solo fine di erogare il Servizio.
          </p>
        </Section>

        <Section title="8. Limitazione di Responsabilità">
          <p>
            Il Servizio è fornito "così com'è". Nei limiti consentiti dalla legge, la nostra responsabilità totale
            è limitata all'importo pagato nell'ultimo mese, o €10 se il servizio era gratuito.
            Non siamo responsabili per danni indiretti o perdita di profitti.
          </p>
        </Section>

        <Section title="9. Sospensione e Cancellazione">
          <p>
            Puoi cancellare l'account in qualsiasi momento dalle impostazioni. I dati vengono eliminati entro 30 giorni,
            salvo obblighi di conservazione legale. Possiamo sospendere account in caso di violazione dei Termini
            o mancato pagamento.
          </p>
        </Section>

        <Section title="10. Legge Applicabile">
          <p>
            I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente
            il Tribunale di Milano, salvo diversa disposizione inderogabile a favore del consumatore.
          </p>
        </Section>

        <Section title="11. Modifiche">
          <p>
            In caso di modifiche sostanziali ti avviseremo via email con almeno 15 giorni di anticipo.
            L'utilizzo continuato costituisce accettazione dei nuovi Termini.
          </p>
        </Section>

        <Section title="12. Titolare e Contatti">
          <p>
            Il Servizio <strong className="text-white/80">Preventivo Veloce</strong> è gestito da{' '}
            <strong className="text-white/80">Federico Lardieri</strong>, C.F.{' '}
            <span className="text-white/75">LRDFRC02D22B745R</span>, residente in Via Sebastiano Satta 308,
            09013 Carbonia (SU), Italia.
          </p>
          <p>
            Per domande, segnalazioni o esercizio del diritto di recesso:{' '}
            <a href="mailto:support@ilpreventivoveloce.it" className="text-[#a78bfa] hover:text-white transition-colors underline underline-offset-2">
              support@ilpreventivoveloce.it
            </a>
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">© 2026 Preventivo Veloce. Tutti i diritti riservati.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="text-xs text-white/35 hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link href="/login" className="text-xs text-white/35 hover:text-white/70 transition-colors">Accedi</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
