import { describe, it, expect } from 'vitest';
import { quoteSchema } from './quoteSchema';

function validQuote(overrides: Record<string, unknown> = {}) {
  return {
    id: 'aabbccdd-1234-5678-9abc-def012345678',
    number: 'PRV-2026-001',
    status: 'bozza',
    template: 'classic',
    theme: {
      primaryColor: '#5c32e6',
      accentColor: '#1d4ed8',
      textColor: '#1e293b',
      fontFamily: 'Helvetica',
      tableStyle: 'striped',
      logoPosition: 'left',
      showFooterNotes: true,
      showPaymentTerms: true,
    },
    sender: {
      name: 'Acme Srl',
      address: 'Via Roma 1',
      city: 'Milano',
      postalCode: '20100',
      country: 'IT',
      vatNumber: 'IT12345678901',
      email: 'info@acme.it',
      phone: '+39 02 1234567',
    },
    client: {
      name: 'Cliente Spa',
      address: 'Via Verdi 2',
      city: 'Roma',
      postalCode: '00100',
      country: 'IT',
      vatNumber: 'IT98765432109',
      email: 'info@cliente.it',
      phone: '+39 06 9876543',
    },
    items: [
      {
        id: 'item-1',
        description: 'Servizio consulenza',
        quantity: 10,
        unitPrice: 15000,
        discount: 0,
        vatRate: 22,
      },
    ],
    notes: 'Note di esempio',
    paymentTerms: 'Bonifico 30gg',
    validityDays: 30,
    currency: 'EUR',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('quoteSchema', () => {
  it('accetta un preventivo valido completo', () => {
    const result = quoteSchema.safeParse(validQuote());
    expect(result.success).toBe(true);
  });

  it('accetta tutti i template validi', () => {
    const templates = ['classic', 'modern', 'minimal', 'bold', 'corporate', 'creative', 'cover-page', 'executive'];
    for (const template of templates) {
      const result = quoteSchema.safeParse(validQuote({ template }));
      expect(result.success).toBe(true);
    }
  });

  it('accetta tutte le valute', () => {
    for (const currency of ['EUR', 'USD', 'GBP', 'CHF']) {
      const result = quoteSchema.safeParse(validQuote({ currency }));
      expect(result.success).toBe(true);
    }
  });

  it('accetta con IBAN opzionale', () => {
    const result = quoteSchema.safeParse(validQuote({ iban: 'IT60X0542811101000000123456' }));
    expect(result.success).toBe(true);
  });

  it('accetta con allegati validi', () => {
    const result = quoteSchema.safeParse(validQuote({
      attachments: [
        { id: 'att-1', name: 'doc.pdf', data: 'data:application/pdf;base64,AAAA', type: 'application/pdf' },
      ],
    }));
    expect(result.success).toBe(true);
  });

  it('rifiuta template non valido', () => {
    const result = quoteSchema.safeParse(validQuote({ template: 'nonexistent' }));
    expect(result.success).toBe(false);
  });

  it('rifiuta status non valido', () => {
    const result = quoteSchema.safeParse(validQuote({ status: 'pagato' }));
    expect(result.success).toBe(false);
  });

  it('rifiuta valuta non supportata', () => {
    const result = quoteSchema.safeParse(validQuote({ currency: 'JPY' }));
    expect(result.success).toBe(false);
  });

  it('rifiuta items non array', () => {
    const result = quoteSchema.safeParse(validQuote({ items: 'not-array' }));
    expect(result.success).toBe(false);
  });

  it('rifiuta item senza description', () => {
    const result = quoteSchema.safeParse(validQuote({
      items: [{ id: '1', quantity: 1, unitPrice: 100, discount: 0, vatRate: 22 }],
    }));
    expect(result.success).toBe(false);
  });

  it('rifiuta allegato con tipo non supportato', () => {
    const result = quoteSchema.safeParse(validQuote({
      attachments: [
        { id: 'att-1', name: 'video.mp4', data: 'data:video/mp4;base64,AAAA', type: 'video/mp4' },
      ],
    }));
    expect(result.success).toBe(false);
  });

  it('rifiuta fontFamily non supportato', () => {
    const result = quoteSchema.safeParse(validQuote({
      theme: { ...validQuote().theme, fontFamily: 'Comic Sans' },
    }));
    expect(result.success).toBe(false);
  });

  it('accetta flag _preview e _view', () => {
    const result = quoteSchema.safeParse(validQuote({ _preview: true, _view: false }));
    expect(result.success).toBe(true);
  });
});
