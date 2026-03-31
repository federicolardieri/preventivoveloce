import { create } from 'zustand';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ClientProfile {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  vatNumber: string;
  email: string;
  phone: string;
  customFields?: { id: string; label: string; value: string }[];
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

function fromRow(row: Record<string, unknown>): ClientProfile {
  const cf = row.custom_fields as { id: string; label: string; value: string }[] | null;
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    address: (row.address as string) ?? '',
    city: (row.city as string) ?? '',
    postalCode: (row.postal_code as string) ?? '',
    country: (row.country as string) ?? '',
    vatNumber: (row.vat_number as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    customFields: Array.isArray(cf) ? cf : [],
  };
}

function toRow(c: Omit<ClientProfile, 'id' | 'quotesCount'>) {
  return {
    name: c.name,
    address: c.address,
    city: c.city,
    postal_code: c.postalCode,
    country: c.country,
    vat_number: c.vatNumber,
    email: c.email,
    phone: c.phone,
    custom_fields: c.customFields ?? [],
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface ClientStoreState {
  clients: ClientProfile[];
  loadFromSupabase: (supabase: SupabaseClient) => Promise<void>;
  addClient: (supabase: SupabaseClient, data: Omit<ClientProfile, 'id'>) => Promise<ClientProfile | null>;
  updateClient: (supabase: SupabaseClient, id: string, data: Partial<Omit<ClientProfile, 'id'>>) => Promise<void>;
  removeClient: (supabase: SupabaseClient, id: string) => Promise<void>;
}

export const useClientStore = create<ClientStoreState>()((set, get) => ({
  clients: [],

  loadFromSupabase: async (supabase) => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) { console.error('loadFromSupabase clients:', error); return; }
    set({ clients: (data ?? []).map((r: Record<string, unknown>) => fromRow(r)) });
  },

  addClient: async (supabase, data) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { console.error('addClient: utente non autenticato'); return null; }

    const { data: row, error } = await supabase
      .from('clients')
      .insert({ ...toRow(data), user_id: user.id })
      .select()
      .single();

    if (error) { console.error('addClient:', error); return null; }
    const newClient = fromRow(row);
    set((state) => ({ clients: [...state.clients, newClient] }));
    return newClient;
  },

  updateClient: async (supabase, id, data) => {
    const existing = get().clients.find((c) => c.id === id);
    if (!existing) return;

    const merged = { ...existing, ...data };
    const { error } = await supabase
      .from('clients')
      .update(toRow(merged))
      .eq('id', id);

    if (error) { console.error('updateClient:', error); return; }
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  removeClient: async (supabase, id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) { console.error('removeClient:', error); return; }
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
  },
}));
