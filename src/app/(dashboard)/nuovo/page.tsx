"use client";

import { useEffect, useRef, useState } from "react";
import { useQuoteStore, createEmptyQuote } from "@/store/quoteStore";
import { QuoteEditor } from "@/components/quote/QuoteEditor";
import { generateQuoteNumber } from "@/lib/utils";

export default function NuovoPreventivoPage() {
  const { setCurrentQuote } = useQuoteStore();
  const [mounted, setMounted] = useState(false);
  // Evita che il preventivo venga ricreato quando quotesList cambia durante il salvataggio.
  // Il flusso era: saveQuote() → quotesList.length++ → useEffect ri-gira → quota vuota
  // sovrascrive currentQuote → saveToSupabase salva dati vuoti nel DB.
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Legge quotesList fresco dallo store (non dalla chiusura del componente)
    // per generare il numero corretto anche se loadFromSupabase è già completato.
    const { quotesList } = useQuoteStore.getState();
    const sequence = quotesList.length + 1;
    const newQuote = createEmptyQuote(generateQuoteNumber(sequence));
    setCurrentQuote(newQuote);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }); // nessuna dipendenza — gira ad ogni render ma la ref blocca le ri-inizializzazioni

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <QuoteEditor />
    </div>
  );
}
