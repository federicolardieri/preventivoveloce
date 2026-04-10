/**
 * Chiama l'API server-side per ottenere il prossimo numero preventivo
 * in modo atomico (basato su advisory lock DB).
 * Fallback: genera un numero locale basato su timestamp per evitare blocco totale.
 */
export async function fetchNextQuoteNumber(): Promise<string> {
  try {
    const res = await fetch('/api/quotes/next-number', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { number: string };
      return data.number;
    }
  } catch {
    // rete non disponibile, fallback
  }
  // Fallback: timestamp-based per evitare blocco UI
  const year = new Date().getFullYear();
  const ts = Date.now().toString().slice(-3);
  return `PRV-${year}-${ts}`;
}
