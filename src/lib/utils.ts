import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { QuoteItem, VatRate } from "../types/quote"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function calculateTotals(items: QuoteItem[]) {
  let subtotal = 0;
  const vatTotals: Record<number, number> = { 0: 0, 4: 0, 10: 0, 22: 0 };

  items.forEach(item => {
    const itemSubtotal = (item.unitPrice * item.quantity) * (1 - item.discount / 100);
    subtotal += itemSubtotal;
    
    const vatAmount = itemSubtotal * (item.vatRate / 100);
    vatTotals[item.vatRate] = (vatTotals[item.vatRate] || 0) + vatAmount;
  });

  const totalVat = Object.values(vatTotals).reduce((sum, amount) => sum + amount, 0);
  const total = subtotal + totalVat;

  return {
    subtotal: Math.round(subtotal),
    vatTotals: Object.fromEntries(
      Object.entries(vatTotals).map(([rate, amount]) => [rate, Math.round(amount)])
    ) as Record<VatRate, number>,
    totalVat: Math.round(totalVat),
    total: Math.round(total)
  };
}

export function generateQuoteNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(3, '0');
  return `PRV-${year}-${paddedSequence}`;
}
