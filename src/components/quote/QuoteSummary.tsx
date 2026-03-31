"use client";

import { useEffect, useState } from "react";
import { useQuoteStore } from "@/store/quoteStore";
import { calculateTotals, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function QuoteSummary() {
  const { currentQuote } = useQuoteStore();

  // Basic hydration guard to prevent mismatch during SSR
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted || !currentQuote) return null;

  const { subtotal, vatTotals, totalVat, total } = calculateTotals(currentQuote.items);

  return (
    <Card className="shadow-sm border-slate-200 bg-slate-50/50">
      <CardContent className="p-6">
        <div className="space-y-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Imponibile Totale</span>
            <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
          
          {Object.entries(vatTotals).map(([rate, amount]) => {
            if (amount <= 0) return null;
            return (
              <div key={rate} className="flex justify-between text-slate-500">
                <span>IVA ({rate}%)</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            );
          })}
          
          <Separator className="my-2" />
          
          <div className="flex justify-between items-end">
            <span className="text-base font-semibold text-slate-900">Totale Documento</span>
            <div className="text-right">
              <div className="text-2xl font-bold tracking-tight text-blue-600">
                {formatCurrency(total)}
              </div>
              <div className="text-xs text-slate-500 pt-1">
                Tasse incluse ({formatCurrency(totalVat)})
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
