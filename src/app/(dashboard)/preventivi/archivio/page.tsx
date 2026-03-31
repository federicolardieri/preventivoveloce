"use client";

import { useQuoteStore } from "@/store/quoteStore";
import { Quote } from "@/types/quote";
import { formatCurrency } from "@/lib/utils";
import { QuoteStatusBadge } from "@/components/quotes-list/QuoteStatusBadge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArchiveRestore, FileText, Download, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function quoteTotal(quote: Quote): number {
  return quote.items.reduce((sum, item) => {
    const base = item.unitPrice * item.quantity;
    const disc = item.discountType === "fixed" ? (item.discount || 0) : base * ((item.discount || 0) / 100);
    const sub = Math.max(0, base - disc);
    return sum + sub + sub * (item.vatRate / 100);
  }, 0);
}

export default function ArchivioPage() {
  const { archivedList, unarchiveQuote, unarchiveInSupabase } = useQuoteStore();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const sorted = [...archivedList].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleRestore = async (id: string) => {
    unarchiveQuote(id);
    const supabase = createClient();
    await unarchiveInSupabase(supabase, id);
  };

  const handleDownload = async (quote: Quote) => {
    try {
      setDownloadError(null);
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quote),
      });
      if (res.status === 403) {
        const err = await res.json();
        setDownloadError(err.message ?? "Limite raggiunto. Passa a un piano superiore.");
        return;
      }
      if (!res.ok) throw new Error("Errore generazione PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `preventivo-${quote.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  if (sorted.length === 0) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground tracking-tight">Archivio Preventivi</h1>
          <p className="text-muted-foreground font-medium mt-1">Preventivi archiviati e non più attivi</p>
        </div>
        <div className="text-center py-20 px-6 rounded-3xl bg-muted/20 border-2 border-dashed border-border flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">Archivio vuoto</h3>
          <p className="text-muted-foreground mb-8 max-w-md font-medium leading-relaxed">
            Nessun preventivo archiviato. Puoi archiviare i preventivi dallo storico usando il menu azioni.
          </p>
          <Link href="/preventivi">
            <Button className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-2xl font-bold">
              Vai allo Storico
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Archivio Preventivi</h1>
        <p className="text-muted-foreground font-medium mt-1">
          {sorted.length} preventiv{sorted.length !== 1 ? "i" : "o"} archiviati
        </p>
      </div>

      {downloadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm font-bold text-red-800">{downloadError}</p>
          </div>
          <a href="/#pricing" className="text-sm text-red-600 underline font-bold whitespace-nowrap ml-4">
            Sblocca il piano →
          </a>
        </div>
      )}

      <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
        <Table className="min-w-[650px]">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="font-bold text-card-foreground/70 h-12">Numero</TableHead>
              <TableHead className="font-bold text-card-foreground/70 h-12">Cliente</TableHead>
              <TableHead className="font-bold text-card-foreground/70 h-12">Data</TableHead>
              <TableHead className="font-bold text-card-foreground/70 h-12">Stato</TableHead>
              <TableHead className="text-right font-bold text-card-foreground/70 h-12">Importo</TableHead>
              <TableHead className="text-right font-bold text-card-foreground/70 h-12 w-[130px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((quote) => (
              <TableRow key={quote.id} className="hover:bg-muted/20 border-border transition-colors group">
                <TableCell className="font-bold text-card-foreground">{quote.number}</TableCell>
                <TableCell>
                  <div className="font-bold text-card-foreground">{quote.client.name || "Senza nome"}</div>
                  {quote.client.email && (
                    <div className="text-xs text-muted-foreground">{quote.client.email}</div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground font-medium">
                  {format(new Date(quote.createdAt), "dd MMM yyyy", { locale: it })}
                </TableCell>
                <TableCell>
                  <QuoteStatusBadge status={quote.status} />
                </TableCell>
                <TableCell className="text-right font-black text-card-foreground">
                  {formatCurrency(quoteTotal(quote))}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(quote)}
                      className="h-8 px-2 text-primary hover:bg-primary/10"
                      title="Scarica PDF"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(quote.id)}
                      className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 font-bold text-xs gap-1"
                      title="Ripristina"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      Ripristina
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
