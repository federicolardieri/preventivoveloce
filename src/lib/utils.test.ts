import { describe, it, expect } from 'vitest';
import { calculateTotals, formatCurrency, formatAmount } from './utils';
import type { QuoteItem } from '@/types/quote';

function item(overrides: Partial<QuoteItem> = {}): QuoteItem {
  return {
    id: '1',
    description: 'Test',
    quantity: 1,
    unitPrice: 10000, // 100.00 EUR
    discount: 0,
    discountType: 'percentage',
    vatRate: 22,
    ...overrides,
  };
}

describe('calculateTotals', () => {
  it('singola riga senza sconto con IVA 22%', () => {
    const result = calculateTotals([item()]);
    expect(result.subtotal).toBe(10000);
    expect(result.vatTotals[22]).toBe(2200);
    expect(result.totalVat).toBe(2200);
    expect(result.total).toBe(12200);
  });

  it('singola riga IVA 0%', () => {
    const result = calculateTotals([item({ vatRate: 0 })]);
    expect(result.subtotal).toBe(10000);
    expect(result.vatTotals[0]).toBe(0);
    expect(result.totalVat).toBe(0);
    expect(result.total).toBe(10000);
  });

  it('righe multiple con aliquote diverse', () => {
    const items = [
      item({ unitPrice: 10000, vatRate: 22 }),
      item({ id: '2', unitPrice: 5000, vatRate: 10 }),
      item({ id: '3', unitPrice: 2000, vatRate: 4 }),
    ];
    const result = calculateTotals(items);
    expect(result.subtotal).toBe(17000);
    expect(result.vatTotals[22]).toBe(2200);
    expect(result.vatTotals[10]).toBe(500);
    expect(result.vatTotals[4]).toBe(80);
    expect(result.totalVat).toBe(2780);
    expect(result.total).toBe(19780);
  });

  it('sconto percentuale', () => {
    const result = calculateTotals([item({ discount: 10, discountType: 'percentage' })]);
    // 10000 - 10% = 9000
    expect(result.subtotal).toBe(9000);
    expect(result.vatTotals[22]).toBe(1980);
    expect(result.total).toBe(10980);
  });

  it('sconto fisso (centesimi)', () => {
    const result = calculateTotals([item({ discount: 2000, discountType: 'fixed' })]);
    // 10000 - 2000 = 8000
    expect(result.subtotal).toBe(8000);
    expect(result.vatTotals[22]).toBe(1760);
    expect(result.total).toBe(9760);
  });

  it('quantita > 1', () => {
    const result = calculateTotals([item({ quantity: 5, unitPrice: 3000 })]);
    // 5 * 3000 = 15000
    expect(result.subtotal).toBe(15000);
    expect(result.total).toBe(18300); // 15000 + 22% = 18300
  });

  it('sconto non supera il subtotale riga (clamp a 0)', () => {
    const result = calculateTotals([item({ discount: 99999, discountType: 'fixed' })]);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it('array vuoto', () => {
    const result = calculateTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.totalVat).toBe(0);
    expect(result.total).toBe(0);
  });

  it('risultati sono sempre interi (centesimi)', () => {
    // Prezzo che genera decimali: 333 * 3 * 22% = 219.78 → arrotondato
    const result = calculateTotals([item({ unitPrice: 333, quantity: 3, vatRate: 22 })]);
    expect(Number.isInteger(result.subtotal)).toBe(true);
    expect(Number.isInteger(result.totalVat)).toBe(true);
    expect(Number.isInteger(result.total)).toBe(true);
  });

  it('imponibile + iva ~ totale (tolleranza ±1 cent per arrotondamento)', () => {
    const items = [
      item({ unitPrice: 12345, quantity: 2, vatRate: 22 }),
      item({ id: '2', unitPrice: 6789, quantity: 3, vatRate: 10, discount: 5 }),
    ];
    const result = calculateTotals(items);
    // Il totale è arrotondato sulla somma pre-round, quindi può divergere
    // di ±1 cent dalla somma dei singoli arrotondamenti
    expect(Math.abs(result.total - (result.subtotal + result.totalVat))).toBeLessThanOrEqual(1);
  });
});

describe('formatCurrency', () => {
  it('formatta centesimi in EUR italiano', () => {
    const result = formatCurrency(12345);
    expect(result).toContain('123,45');
  });
});

describe('formatAmount', () => {
  it('usa il simbolo EUR', () => {
    expect(formatAmount(10000, 'EUR')).toContain('100,00');
  });

  it('usa $ per USD', () => {
    expect(formatAmount(10000, 'USD')).toContain('$');
  });
});
