import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accedi',
  description: 'Accedi al tuo account Preventivo Veloce e gestisci i tuoi preventivi.',
  alternates: { canonical: '/login' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
