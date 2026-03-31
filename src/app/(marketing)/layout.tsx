const jsonLdSoftware = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Preventivo Veloce",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://preventivoveloce.it",
  "description": "Generatore di preventivi online con AI. Crea preventivi professionali in 20 secondi: template PDF, IVA automatica, storico clienti. Gratis.",
  "screenshot": "https://preventivoveloce.it/og-image.png",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "EUR",
      "description": "1 preventivo totale, gratis per sempre"
    },
    {
      "@type": "Offer",
      "name": "Starter",
      "price": "9.90",
      "priceCurrency": "EUR",
      "description": "10 preventivi al mese, PDF senza watermark"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "29",
      "priceCurrency": "EUR",
      "description": "Preventivi illimitati, tutti i template premium"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "128"
  }
};

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Come funziona il generatore di preventivi?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Descrivi il lavoro in una frase in italiano. L'AI genera automaticamente voci, prezzi, IVA e sconti e crea un PDF professionale in 20 secondi pronto da inviare al cliente."
      }
    },
    {
      "@type": "Question",
      "name": "Il generatore di preventivi è gratis?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sì, Preventivo Veloce ha un piano Free gratuito per sempre che include 1 preventivo completo con AI e PDF. Non è richiesta nessuna carta di credito."
      }
    },
    {
      "@type": "Question",
      "name": "Posso personalizzare i preventivi con il mio logo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sì, puoi caricare il tuo logo aziendale, scegliere tra 8 template professionali, personalizzare colori e font. Il PDF generato riporta il tuo brand."
      }
    },
    {
      "@type": "Question",
      "name": "Il generatore di preventivi calcola l'IVA automaticamente?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sì, Preventivo Veloce calcola automaticamente IVA (0%, 4%, 10%, 22%), sconti percentuali o fissi, e il totale finale. Zero errori di calcolo."
      }
    },
    {
      "@type": "Question",
      "name": "Posso usare il generatore di preventivi da smartphone?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sì, Preventivo Veloce è una web app accessibile da qualsiasi browser su smartphone, tablet e computer. Non serve installare nulla."
      }
    }
  ]
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Preventivo Veloce",
  "url": "https://preventivoveloce.it",
  "logo": "https://preventivoveloce.it/logo.png",
  "description": "Generatore di preventivi online con AI per professionisti e piccole imprese italiane.",
  "foundingDate": "2026",
  "areaServed": "IT"
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
      />
      {children}
    </>
  );
}
