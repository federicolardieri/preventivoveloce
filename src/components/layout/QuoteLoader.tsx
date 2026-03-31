"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuoteStore } from "@/store/quoteStore";
import { useProfileStore } from "@/store/profileStore";
import { useClientStore } from "@/store/clientStore";

interface QuoteLoaderProps {
  plan: 'free' | 'starter' | 'pro';
}

export function QuoteLoader({ plan }: QuoteLoaderProps) {
  const { loadFromSupabase, setProPlan } = useQuoteStore();
  const { loadFromSupabase: loadCompanies } = useProfileStore();
  const { loadFromSupabase: loadClients } = useClientStore();

  useEffect(() => {
    setProPlan(plan === 'pro');

    const supabase = createClient();
    loadFromSupabase(supabase).catch(console.error);
    loadCompanies(supabase).catch(console.error);
    loadClients(supabase).catch(console.error);
  }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
