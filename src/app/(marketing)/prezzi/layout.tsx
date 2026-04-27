import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prezzi — Piani Free, Starter e Pro',
  description: 'Scopri i piani di Preventivo Veloce: Free gratis per sempre, Starter a €9,90/mese, Pro a €29/mese. Preventivi illimitati con AI, PDF professionali, nessun contratto.',
  alternates: { canonical: '/prezzi' },
  openGraph: {
    url: '/prezzi',
    title: 'Prezzi Preventivo Veloce — Free, Starter e Pro',
    description: 'Piano Free gratuito per sempre. Starter da €9,90/mese. Pro da €29/mese con preventivi illimitati e AI inclusa.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
