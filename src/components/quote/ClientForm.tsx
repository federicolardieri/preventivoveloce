"use client";

import { useState, useRef, useEffect } from "react";
import { useQuoteStore } from "@/store/quoteStore";
import { useClientStore } from "@/store/clientStore";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronDown, UserRound, Save } from "lucide-react";

export function ClientForm() {
  const { currentQuote, updateClient, updateDetails } = useQuoteStore();
  const { clients, addClient } = useClientStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  if (!currentQuote) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateClient({ [e.target.name]: e.target.value });
    setSelectedClientId(null);
    updateDetails({ clientId: undefined });
  };

  const applyClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    updateClient({
      name: client.name,
      address: client.address,
      city: client.city,
      postalCode: client.postalCode,
      country: client.country,
      vatNumber: client.vatNumber,
      email: client.email,
      phone: client.phone,
      customFields: client.customFields ?? [],
    });
    setSelectedClientId(id);
    updateDetails({ clientId: id });
    setPickerOpen(false);
  };

  const handleSaveClient = async () => {
    const c = currentQuote.client;
    if (!c.name.trim()) return;

    setSaving(true);
    const supabase = createClient();
    const result = await addClient(supabase, {
      name: c.name,
      address: c.address,
      city: c.city,
      postalCode: c.postalCode,
      country: c.country,
      vatNumber: c.vatNumber,
      email: c.email,
      phone: c.phone,
      customFields: c.customFields,
    });
    setSaving(false);

    if (result) {
      setSelectedClientId(result.id);
      updateDetails({ clientId: result.id });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    }
  };

  const client = currentQuote.client;
  const isAlreadySaved = selectedClientId !== null || clients.some(
    (c) => c.name === client.name && c.vatNumber === client.vatNumber && c.name.trim() !== ''
  );

  const addCustomField = () => {
    const fields = client.customFields || [];
    updateClient({
      customFields: [...fields, { id: crypto.randomUUID(), label: 'Nuovo Campo', value: '' }]
    });
  };

  const updateCustomField = (id: string, key: 'label' | 'value', newValue: string) => {
    const fields = client.customFields || [];
    updateClient({
      customFields: fields.map(f => f.id === id ? { ...f, [key]: newValue } : f)
    });
  };

  const removeCustomField = (id: string) => {
    const fields = client.customFields || [];
    updateClient({
      customFields: fields.filter(f => f.id !== id)
    });
  };

  return (
    <Card className="shadow-sm border-border bg-card transition-colors">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg font-bold text-card-foreground tracking-tight">Dati Cliente</CardTitle>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Salva cliente in rubrica */}
            {client.name.trim() && !isAlreadySaved && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveClient}
                disabled={saving}
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold text-xs h-8 gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Salvo...' : 'Salva in rubrica'}
              </Button>
            )}
            {savedFeedback && (
              <span className="text-xs font-bold text-emerald-600 animate-in fade-in">Salvato!</span>
            )}

            {/* Picker clienti salvati */}
            {clients.length > 0 && (
              <div className="relative" ref={pickerRef}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="border-indigo-200 text-[#5c32e6] hover:bg-indigo-50 rounded-xl font-bold text-xs h-8 gap-1.5"
                >
                  <UserRound className="w-3.5 h-3.5" />
                  Rubrica clienti
                  <ChevronDown className="w-3 h-3" />
                </Button>

                {pickerOpen && (
                  <div className="absolute right-0 top-10 z-50 w-72 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 pt-4 pb-2 border-b border-border/50">
                      Seleziona cliente
                    </p>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {clients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => applyClient(c.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <UserRound className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-card-foreground truncate">{c.name}</p>
                            {c.vatNumber && (
                              <p className="text-[11px] text-muted-foreground truncate font-medium">P.IVA {c.vatNumber}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client.name">Intestatario / Ragione Sociale</Label>
            <Input id="client.name" name="name" value={client.name} onChange={handleChange} placeholder="Es. Cliente Spa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client.vatNumber">Partita IVA / C.F.</Label>
            <Input id="client.vatNumber" name="vatNumber" value={client.vatNumber} onChange={handleChange} placeholder="IT09876543210" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client.address">Indirizzo</Label>
          <Input id="client.address" name="address" value={client.address} onChange={handleChange} placeholder="Viale delle Industrie 5" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="client.city">Citta</Label>
            <Input id="client.city" name="city" value={client.city} onChange={handleChange} placeholder="Torino" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client.postalCode">CAP</Label>
            <Input id="client.postalCode" name="postalCode" value={client.postalCode} onChange={handleChange} placeholder="10100" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client.country">Paese</Label>
            <Input id="client.country" name="country" value={client.country} onChange={handleChange} placeholder="Italia" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client.email">Email</Label>
            <Input id="client.email" name="email" value={client.email} onChange={handleChange} placeholder="amministrazione@cliente.it" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client.phone">Telefono</Label>
            <Input id="client.phone" name="phone" value={client.phone} onChange={handleChange} placeholder="+39 011 7654321" />
          </div>
        </div>

        {/* Custom Fields */}
        {(client.customFields || []).length > 0 && (
          <div className="pt-4 mt-2 border-t border-border space-y-4 font-bold text-sm">
            <h4 className="text-sm font-bold text-card-foreground">Campi Personalizzati</h4>
            {client.customFields?.map(field => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end animate-in fade-in">
                <div className="space-y-2 flex-1 min-w-0">
                  <Label>Nome Campo</Label>
                  <Input value={field.label} onChange={e => updateCustomField(field.id, 'label', e.target.value)} placeholder="Es. SDI / PEC" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <Label>Valore</Label>
                  <Input value={field.value} onChange={e => updateCustomField(field.id, 'value', e.target.value)} placeholder="Es. M5UXCR1" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeCustomField(field.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 self-end sm:mb-0.5 h-11 w-11 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" onClick={addCustomField} className="w-full mt-4 border-dashed border-border text-primary hover:bg-primary/10 transition-colors font-bold">
          <Plus className="h-4 w-4 mr-2" /> Aggiungi Campo Personalizzato
        </Button>
      </CardContent>
    </Card>
  );
}
