"use client";

import { useEffect, useState, use } from "react";
import { useQuoteStore } from "@/store/quoteStore";
import { QuoteViewer } from "@/components/quote/QuoteViewer";
import { useRouter } from "next/navigation";

export default function DettaglioPreventivoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { quotesList, setCurrentQuote } = useQuoteStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const quote = quotesList.find(q => q.id === resolvedParams.id);
    if (quote) {
      setCurrentQuote(quote);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
    } else {
      router.push("/preventivi"); // not found
    }
  }, [resolvedParams.id, quotesList, setCurrentQuote, router]);

  if (!mounted) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <QuoteViewer />
    </div>
  );
}
