import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrati Gratis',
  description: 'Crea il tuo account Preventivo Veloce gratis. Nessuna carta di credito richiesta. Inizia a generare preventivi professionali con AI in 20 secondi.',
  alternates: { canonical: '/register' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
