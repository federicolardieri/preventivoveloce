import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Preventivo Veloce',
  description: 'Informativa sul trattamento dei dati personali ai sensi del GDPR.',
  robots: { index: false },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-base font-black text-white mb-3 pb-2 border-b border-white/8">{title}</h2>
    <div className="space-y-3 text-sm text-white/55 leading-relaxed">{children}</div>
  </section>
);

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-white/30 text-xs">Ultimo aggiornamento: marzo 2026</p>
        </div>

        {/* Sections */}
        <Section title="1. Titolare del Trattamento">
          <p>
            Il titolare del trattamento dei dati personali è <strong className="text-white/80">Federico Lardieri</strong>,
            C.F. <span className="text-white/75">LRDFRC02D22B745R</span>, residente in Via Sebastiano Satta 308,
            09013 Carbonia (SU), Italia, titolare del progetto <strong className="text-white/80">Preventivo Veloce</strong>.
          </p>
          <p>
            Per qualsiasi questione relativa alla privacy o per esercitare i tuoi diritti puoi contattarci all'indirizzo:{' '}
            <a href="mailto:privacy@ilpreventivoveloce.it" className="text-[#a78bfa] hover:text-white transition-colors underline underline-offset-2">
              privacy@ilpreventivoveloce.it
            </a>
          </p>
        </Section>

        <Section title="2. Dati Raccolti">
          <p>Raccogliamo i seguenti dati personali:</p>
          <ul className="space-y-2 mt-2">
            {[
              ['Dati di registrazione', 'nome, indirizzo email, password (cifrata)'],
              ['Dati di utilizzo', 'preventivi creati, azioni compiute nel servizio, date e orari di accesso'],
              ['Dati di pagamento', 'gestiti direttamente da Stripe; non memorizziamo dati di carta di credito'],
              ['Dati tecnici', 'indirizzo IP, tipo di browser, sistema operativo (raccolti automaticamente)'],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2">
                <span className="text-[#a78bfa] mt-0.5">·</span>
                <span><strong className="text-white/75">{label}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="3. Finalità del Trattamento">
          <p>I tuoi dati vengono trattati per:</p>
          <ul className="space-y-1.5 mt-2">
            {[
              'Fornitura del servizio e gestione del tuo account',
              'Invio di comunicazioni transazionali (conferma email, reset password, fatture)',
              'Gestione dei pagamenti e degli abbonamenti',
              'Assistenza clienti',
              'Adempimento di obblighi legali e fiscali',
              'Miglioramento del servizio tramite analisi aggregata e anonima',
            ].map(item => (
              <li key={item} className="flex gap-2">
                <span className="text-[#a78bfa] mt-0.5">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="4. Base Giuridica">
          <ul className="space-y-2">
            {[
              ['Esecuzione del contratto', 'per erogare il servizio a cui ti sei registrato'],
              ['Obbligo legale', 'per adempiere a norme fiscali e contabili'],
              ['Legittimo interesse', 'per prevenire frodi e migliorare la sicurezza'],
              ['Consenso', 'per comunicazioni di marketing, se applicabile'],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2">
                <span className="text-[#a78bfa] mt-0.5">·</span>
                <span><strong className="text-white/75">{label}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="5. Conservazione dei Dati">
          <p>
            I tuoi dati sono conservati per tutta la durata del rapporto contrattuale e, successivamente,
            per il periodo richiesto dalla normativa fiscale vigente (generalmente 10 anni).
            I dati dell'account vengono eliminati su richiesta, salvo obblighi di legge.
          </p>
        </Section>

        <Section title="6. Condivisione con Terze Parti">
          <p>Non vendiamo i tuoi dati. Li condividiamo solo con i seguenti fornitori (sub-processor):</p>
          <ul className="space-y-2 mt-2">
            {[
              ['Supabase', 'database, autenticazione e storage file (dati archiviati in UE)'],
              ['Vercel', 'hosting dell\'applicazione'],
              ['Stripe', 'elaborazione pagamenti e fatturazione'],
              ['Resend', 'invio email transazionali (registrazione, conferma preventivi, reset password)'],
              ['Upstash', 'rate limiting — memorizza temporaneamente l\'indirizzo IP per prevenire abusi'],
              ['Sentry', 'monitoraggio errori applicativi — può raccogliere informazioni tecniche sul contesto in cui l\'errore si è verificato'],
              ['Google (Gemini)', 'assistente AI — i testi che inserisci nell\'assistente vengono elaborati dai modelli Gemini di Google'],
              ['Vercel Analytics', 'statistiche di utilizzo anonime e aggregate (pageview, dispositivi, paesi — nessun cookie, nessun dato personale)'],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2">
                <span className="text-[#a78bfa] mt-0.5">·</span>
                <span><strong className="text-white/75">{label}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">Tutti i fornitori sono vincolati da accordi conformi al GDPR.</p>
        </Section>

        <Section title="7. Trasferimento Internazionale dei Dati">
          <p>
            Alcuni fornitori (Stripe, Vercel) potrebbero trattare dati al di fuori dell'UE.
            Tali trasferimenti avvengono nel rispetto delle garanzie previste dal GDPR
            (Clausole Contrattuali Standard o decisioni di adeguatezza).
          </p>
        </Section>

        <Section title="8. I Tuoi Diritti (GDPR)">
          <p>Hai il diritto di:</p>
          <ul className="space-y-1.5 mt-2">
            {[
              ['Accesso', 'ottenere conferma del trattamento e copia dei tuoi dati'],
              ['Rettifica', 'correggere dati inesatti o incompleti'],
              ['Cancellazione', 'richiedere la rimozione dei tuoi dati ("diritto all\'oblio")'],
              ['Portabilità', 'ricevere i tuoi dati in formato strutturato e leggibile'],
              ['Limitazione', 'limitare il trattamento in determinate circostanze'],
              ['Opposizione', 'opporti al trattamento basato su legittimo interesse'],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2">
                <span className="text-[#a78bfa] mt-0.5">·</span>
                <span><strong className="text-white/75">{label}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Per esercitare i tuoi diritti scrivi a{' '}
            <a href="mailto:privacy@ilpreventivoveloce.it" className="text-[#a78bfa] hover:text-white transition-colors underline underline-offset-2">
              privacy@ilpreventivoveloce.it
            </a>.
            Puoi inoltre proporre reclamo al Garante Privacy (garanteprivacy.it).
          </p>
        </Section>

        <Section title="9. Cookie">
          <p>
            Utilizziamo esclusivamente cookie tecnici e di sessione necessari al funzionamento del servizio
            (autenticazione, preferenze di sessione). Non utilizziamo cookie di profilazione o pubblicitari.
          </p>
        </Section>

        <Section title="10. Sicurezza">
          <p>
            Adottiamo misure tecniche adeguate a proteggere i tuoi dati: cifratura in transito (TLS),
            cifratura a riposo, autenticazione sicura e Row Level Security sul database.
          </p>
        </Section>

        <Section title="11. Modifiche">
          <p>
            In caso di modifiche sostanziali ti notificheremo via email.
            La data "ultimo aggiornamento" indica la versione corrente.
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">© 2026 Preventivo Veloce. Tutti i diritti riservati.</p>
          <div className="flex gap-6">
            <Link href="/termini" className="text-xs text-white/35 hover:text-white/70 transition-colors">Termini e Condizioni</Link>
            <Link href="/login" className="text-xs text-white/35 hover:text-white/70 transition-colors">Accedi</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
