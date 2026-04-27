import '@/env';
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ilpreventivoveloce.it";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Preventivo Veloce — Generatore di Preventivi Online Gratis con AI",
    template: "%s | Preventivo Veloce",
  },
  description:
    "Genera preventivi professionali in 20 secondi con l'AI. Generatore di preventivi online gratuito: invio automatico ai clienti, template PDF, IVA automatica e storico. Il modo più veloce per creare preventivi.",
  keywords: [
    "generatore preventivo",
    "generatore preventivi",
    "generatore preventivo automatico",
    "generatore preventivo online",
    "creare preventivo online",
    "preventivo online gratis",
    "software preventivi",
    "app preventivi",
    "preventivo professionale",
    "preventivo PDF",
    "preventivo con AI",
    "fare preventivo online",
  ],
  authors: [{ name: "Preventivo Veloce" }],
  creator: "Preventivo Veloce",
  publisher: "Preventivo Veloce",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName: "Preventivo Veloce",
    title: "Preventivo Veloce — Generatore di Preventivi Online Gratis con AI",
    description:
      "Genera preventivi professionali in 20 secondi con l'AI. Invio automatico ai clienti, template PDF, IVA automatica e storico. Gratis, nessuna carta richiesta.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Preventivo Veloce — Generatore di Preventivi Online con AI",
    description:
      "Crea e invia preventivi in automatico ai clienti in 20 secondi con l'AI. Gratis, nessuna carta richiesta.",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <CookieBanner />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
