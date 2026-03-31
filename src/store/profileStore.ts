import { create } from 'zustand';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CompanyProfile {
  id: string;
  label: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  vatNumber: string;
  email: string;
  phone: string;
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

// Riga Supabase → CompanyProfile
function fromRow(row: Record<string, unknown>): CompanyProfile {
  const cf = (row.custom_fields as Record<string, string> | null) ?? {};
  return {
    id: row.id as string,
    label: cf.label || (row.name as string) || '',
    name: (row.name as string) ?? '',
    address: (row.address as string) ?? '',
    city: (row.city as string) ?? '',
    postalCode: (row.postal_code as string) ?? '',
    country: (row.country as string) ?? '',
    vatNumber: (row.vat_number as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
  };
}

// CompanyProfile → record da inserire/aggiornare
function toRow(c: Omit<CompanyProfile, 'id'>) {
  return {
    name: c.name,
    address: c.address,
    city: c.city,
    postal_code: c.postalCode,
    country: c.country,
    vat_number: c.vatNumber,
    email: c.email,
    phone: c.phone,
    custom_fields: { label: c.label },
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface ProfileStoreState {
  companies: CompanyProfile[];
  // Carica dal db (chiamato al mount dashboard)
  loadFromSupabase: (supabase: SupabaseClient) => Promise<void>;
  // CRUD con sync Supabase
  addCompany: (supabase: SupabaseClient, data: Omit<CompanyProfile, 'id'>) => Promise<void>;
  updateCompany: (supabase: SupabaseClient, id: string, data: Partial<Omit<CompanyProfile, 'id'>>) => Promise<void>;
  removeCompany: (supabase: SupabaseClient, id: string) => Promise<void>;
}

export const useProfileStore = create<ProfileStoreState>()((set, get) => ({
  companies: [],

  loadFromSupabase: async (supabase) => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) { console.error('loadFromSupabase companies:', error); return; }
    set({ companies: (data ?? []).map(fromRow) });
  },

  addCompany: async (supabase, data) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { console.error('addCompany: utente non autenticato'); return; }

    const { data: row, error } = await supabase
      .from('companies')
      .insert({ ...toRow(data), user_id: user.id })
      .select()
      .single();

    if (error) { console.error('addCompany:', error); return; }
    set((state) => ({ companies: [...state.companies, fromRow(row)] }));
  },

  updateCompany: async (supabase, id, data) => {
    const existing = get().companies.find((c) => c.id === id);
    if (!existing) return;

    const merged: Omit<CompanyProfile, 'id'> = { ...existing, ...data };
    const { error } = await supabase
      .from('companies')
      .update(toRow(merged))
      .eq('id', id);

    if (error) { console.error('updateCompany:', error); return; }
    set((state) => ({
      companies: state.companies.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  removeCompany: async (supabase, id) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) { console.error('removeCompany:', error); return; }
    set((state) => ({ companies: state.companies.filter((c) => c.id !== id) }));
  },
}));
