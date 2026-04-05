import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Quote, QuoteItem, QuoteStatus, QuoteTheme, ContactInfo, QuoteAttachment } from '@/types/quote';

interface QuoteStoreState {
  currentQuote: Quote | null;
  quotesList: Quote[];      // preventivi attivi (non archiviati)
  archivedList: Quote[];    // preventivi archiviati
  isProPlan: boolean;

  // Actions
  setProPlan: (isPro: boolean) => void;
  setCurrentQuote: (quote: Quote) => void;
  clearCurrentQuote: () => void;
  saveQuote: () => void;
  deleteQuote: (id: string) => void;
  duplicateQuote: (id: string) => void;
  changeStatus: (id: string, status: QuoteStatus) => void;

  // Archive
  archiveQuote: (id: string) => void;
  unarchiveQuote: (id: string) => void;
  archiveInSupabase: (supabase: SupabaseClient, id: string) => Promise<void>;
  unarchiveInSupabase: (supabase: SupabaseClient, id: string) => Promise<void>;

  // Current Quote Update Actions
  updateTheme: (theme: Partial<QuoteTheme>) => void;
  updateSender: (sender: Partial<ContactInfo>) => void;
  updateClient: (client: Partial<Omit<ContactInfo, 'logo'>>) => void;
  updateDetails: (details: Partial<Pick<Quote, 'number' | 'status' | 'notes' | 'paymentTerms' | 'iban' | 'validityDays' | 'template' | 'currency' | 'itemCustomColumns' | 'clientId'>>) => void;

  // Items Operations
  addItem: (item: QuoteItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, item: Partial<QuoteItem>) => void;

  // Attachments Operations
  addAttachment: (attachment: QuoteAttachment) => void;
  removeAttachment: (id: string) => void;

  // Supabase Sync
  loadFromSupabase: (supabase: SupabaseClient) => Promise<void>;
  saveToSupabase: (supabase: SupabaseClient, userId: string, quoteSnapshot?: Quote) => Promise<void>;
  deleteFromSupabase: (supabase: SupabaseClient, id: string) => Promise<void>;
  changeStatusInSupabase: (supabase: SupabaseClient, id: string, status: QuoteStatus) => Promise<void>;
}

// Map TypeScript Quote → Supabase DB row
function quoteToDb(quote: Quote, userId: string) {
  const totalCents = quote.items.reduce((sum, item) => {
    const gross = item.quantity * item.unitPrice;
    const discount = item.discountType === 'fixed'
      ? item.discount
      : Math.round(gross * item.discount / 100);
    const net = gross - discount;
    const vat = Math.round(net * item.vatRate / 100);
    return sum + net + vat;
  }, 0);

  return {
    id: quote.id,
    user_id: userId,
    number: quote.number,
    status: quote.status,
    template: quote.template,
    theme: quote.theme,
    sender: { ...quote.sender, logoOriginal: undefined },
    client: quote.client,
    items: quote.items,
    notes: quote.notes,
    payment_terms: quote.paymentTerms,
    iban: quote.iban ?? null,
    validity_days: quote.validityDays,
    currency: quote.currency,
    item_custom_columns: quote.itemCustomColumns ?? [],
    client_id: quote.clientId ?? null,
    archived: quote.archived ?? false,
    attachments: quote.attachments ?? [],
    total_cents: totalCents,
    updated_at: new Date().toISOString(),
  };
}

// Map Supabase DB row → TypeScript Quote
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToQuote(row: Record<string, any>): Quote {
  return {
    id: row.id,
    number: row.number,
    status: row.status as QuoteStatus,
    template: row.template,
    theme: row.theme,
    sender: row.sender,
    client: row.client,
    items: row.items ?? [],
    notes: row.notes ?? '',
    paymentTerms: row.payment_terms ?? '',
    iban: row.iban ?? undefined,
    validityDays: row.validity_days ?? 30,
    currency: row.currency ?? 'EUR',
    itemCustomColumns: row.item_custom_columns ?? [],
    attachments: row.attachments ?? [],
    clientId: row.client_id ?? undefined,
    archived: row.archived ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const defaultSender: ContactInfo = {
  name: '', address: '', city: '', postalCode: '', country: '', vatNumber: '', email: '', phone: ''
};

const defaultClient: Omit<ContactInfo, 'logo'> = {
  name: '', address: '', city: '', postalCode: '', country: '', vatNumber: '', email: '', phone: ''
};

const defaultTheme: QuoteTheme = {
  primaryColor: '#5c32e6',
  accentColor: '#1d4ed8',
  textColor: '#1e293b',
  fontFamily: 'Helvetica',
  tableStyle: 'striped',
  logoPosition: 'left',
  logoShape: 'original',
  logoScale: 1,
  logoOffsetX: 0,
  logoOffsetY: 0,
  showFooterNotes: true,
  showPaymentTerms: true,
};

export const createEmptyQuote = (number: string): Quote => ({
  id: crypto.randomUUID(),
  number,
  status: 'bozza',
  template: 'classic',
  theme: defaultTheme,
  sender: defaultSender,
  client: defaultClient,
  items: [],
  notes: '',
  paymentTerms: 'Bonifico bancario a 30 giorni data fattura',
  validityDays: 30,
  currency: 'EUR',
  itemCustomColumns: [],
  attachments: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useQuoteStore = create<QuoteStoreState>()(
  persist(
    (set, get) => ({
      currentQuote: null,
      quotesList: [],
      archivedList: [],
      isProPlan: false,

      setProPlan: (isPro) => set({ isProPlan: isPro }),

      setCurrentQuote: (quote) => set({ currentQuote: quote }),
      clearCurrentQuote: () => set({ currentQuote: null }),

      saveQuote: () => set((state) => {
        if (!state.currentQuote) return state;
        const updatedQuote = { ...state.currentQuote, updatedAt: new Date().toISOString() };
        const existingIndex = state.quotesList.findIndex(q => q.id === updatedQuote.id);

        const newQuotesList = [...state.quotesList];
        if (existingIndex >= 0) {
          newQuotesList[existingIndex] = updatedQuote;
        } else {
          newQuotesList.push(updatedQuote);
        }

        return { currentQuote: updatedQuote, quotesList: newQuotesList };
      }),

      deleteQuote: (id) => set((state) => ({
        quotesList: state.quotesList.filter(q => q.id !== id),
        currentQuote: state.currentQuote?.id === id ? null : state.currentQuote
      })),

      // ── Archive ──────────────────────────────────────────────────────────────

      archiveQuote: (id) => set((state) => {
        const quote = state.quotesList.find(q => q.id === id);
        if (!quote) return state;
        return {
          quotesList: state.quotesList.filter(q => q.id !== id),
          archivedList: [...state.archivedList, { ...quote, archived: true }],
        };
      }),

      unarchiveQuote: (id) => set((state) => {
        const quote = state.archivedList.find(q => q.id === id);
        if (!quote) return state;
        return {
          archivedList: state.archivedList.filter(q => q.id !== id),
          quotesList: [{ ...quote, archived: false }, ...state.quotesList],
        };
      }),

      archiveInSupabase: async (supabase, id) => {
        const { error } = await supabase
          .from('quotes')
          .update({ archived: true, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) console.error('archiveInSupabase error:', error.message);
      },

      unarchiveInSupabase: async (supabase, id) => {
        const { error } = await supabase
          .from('quotes')
          .update({ archived: false, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) console.error('unarchiveInSupabase error:', error.message);
      },

      // ─────────────────────────────────────────────────────────────────────────

      duplicateQuote: (id) => set((state) => {
        const quoteToDuplicate = state.quotesList.find(q => q.id === id);
        if (!quoteToDuplicate) return state;

        const newNumberCount = state.quotesList.length + 1;
        const year = new Date().getFullYear();
        const paddedSequence = newNumberCount.toString().padStart(3, '0');
        const newNumber = `PRV-${year}-${paddedSequence}`;

        const newQuote: Quote = {
          ...quoteToDuplicate,
          id: crypto.randomUUID(),
          number: newNumber,
          status: 'bozza',
          archived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        return { quotesList: [...state.quotesList, newQuote], currentQuote: newQuote };
      }),

      changeStatus: (id, status) => set((state) => ({
        quotesList: state.quotesList.map(q =>
          q.id === id ? { ...q, status, updatedAt: new Date().toISOString() } : q
        ),
        currentQuote: state.currentQuote?.id === id
          ? { ...state.currentQuote, status, updatedAt: new Date().toISOString() }
          : state.currentQuote
      })),

      updateTheme: (theme) => set((state) => ({
        currentQuote: state.currentQuote ? {
          ...state.currentQuote,
          theme: { ...state.currentQuote.theme, ...theme }
        } : null
      })),

      updateSender: (sender) => set((state) => ({
        currentQuote: state.currentQuote ? {
          ...state.currentQuote,
          sender: { ...state.currentQuote.sender, ...sender }
        } : null
      })),

      updateClient: (client) => set((state) => ({
        currentQuote: state.currentQuote ? {
          ...state.currentQuote,
          client: { ...state.currentQuote.client, ...client }
        } : null
      })),

      updateDetails: (details) => set((state) => ({
        currentQuote: state.currentQuote ? {
          ...state.currentQuote,
          ...details
        } : null
      })),

      addItem: (item) => set((state) => ({
        currentQuote: state.currentQuote ? {
          ...state.currentQuote,
          items: [...state.currentQuote.items, item]
        } : null
      })),

      removeItem: (id) => set((state) => ({
        currentQuote: state.currentQuote ? {
          ...state.currentQuote,
          items: state.currentQuote.items.filter(i => i.id !== id)
        } : null
      })),

      updateItem: (id, itemUpdate) => set((state) => ({
        currentQuote: state.currentQuote ? {
          ...state.currentQuote,
          items: state.currentQuote.items.map(i =>
            i.id === id ? { ...i, ...itemUpdate } : i
          )
        } : null
      })),

      addAttachment: (attachment) => set((state) => {
        if (!state.currentQuote) return state;
        const currentAttachments = state.currentQuote.attachments || [];
        if (currentAttachments.length >= 7) return state;
        return {
          currentQuote: { ...state.currentQuote, attachments: [...currentAttachments, attachment] }
        };
      }),

      removeAttachment: (id) => set((state) => ({
        currentQuote: state.currentQuote ? {
          ...state.currentQuote,
          attachments: (state.currentQuote.attachments || []).filter(a => a.id !== id)
        } : null
      })),

      // ── Supabase Sync ────────────────────────────────────────────────────────

      loadFromSupabase: async (supabase) => {
        // Exclude attachments (base64) from list query for performance
        const { data: rows, error } = await supabase
          .from('quotes')
          .select('id, user_id, number, status, template, theme, sender, client, items, notes, payment_terms, iban, validity_days, currency, item_custom_columns, total_cents, archived, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error || !rows) return;
        const all = rows.map((row: Record<string, unknown>) => dbToQuote({ ...row, attachments: [] }));
        set({
          quotesList: all.filter(q => !q.archived),
          archivedList: all.filter(q => q.archived),
        });
      },

      saveToSupabase: async (supabase, userId, quoteSnapshot) => {
        const quote = quoteSnapshot ?? get().currentQuote;
        if (!quote) return;

        const { error } = await supabase
          .from('quotes')
          .upsert(quoteToDb(quote, userId), { onConflict: 'id' });

        if (error) console.error('saveToSupabase error:', error.message, error.details);
      },

      deleteFromSupabase: async (supabase, id) => {
        await supabase.from('quotes').delete().eq('id', id);
      },

      changeStatusInSupabase: async (supabase, id, status) => {
        await supabase
          .from('quotes')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
      },
    }),
    {
      name: 'preventivo-veloce-storage',
      partialize: (state) => ({
        currentQuote: state.currentQuote
          ? {
            ...state.currentQuote,
            sender: { ...state.currentQuote.sender, logoOriginal: undefined },
            attachments: state.currentQuote.attachments ?? [],
          }
          : null,
        isProPlan: state.isProPlan,
      }),
    }
  )
);
