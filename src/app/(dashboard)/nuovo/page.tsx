"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useQuoteStore, createEmptyQuote } from "@/store/quoteStore";
import { QuoteEditor } from "@/components/quote/QuoteEditor";
import { fetchNextQuoteNumber } from "@/lib/quote-number";
import { useSearchParams } from "next/navigation";

function NuovoPreventivoContent() {
  const { setCurrentQuote } = useQuoteStore();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  // Evita che il preventivo venga ricreato quando quotesList cambia durante il salvataggio.
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { quotesList } = useQuoteStore.getState();

    // Se c'è un ID in "edit", carichiamo quel preventivo dallo store
    if (editId) {
      const quoteToEdit = quotesList.find(q => q.id === editId);
      if (quoteToEdit) {
        setCurrentQuote(quoteToEdit);
        setMounted(true);
        return;
      }
    }

    // Altrimenti creiamo un nuovo preventivo vuoto
    fetchNextQuoteNumber().then((number) => {
      const newQuote = createEmptyQuote(number);
      setCurrentQuote(newQuote);
      setMounted(true);
    });
  }, [editId, setCurrentQuote]);

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <QuoteEditor />
    </div>
  );
}

export default function NuovoPreventivoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-bold">Caricamento editor...</div>}>
      <NuovoPreventivoContent />
    </Suspense>
  );
}
