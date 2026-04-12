"use client";

import { useState, useRef, useEffect } from "react";
import { useQuoteStore } from "@/store/quoteStore";
import { useProfileStore } from "@/store/profileStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronDown, Building2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SenderForm() {
  const { currentQuote, updateSender } = useQuoteStore();
  const { companies, addCompany } = useProfileStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
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
    updateSender({ [e.target.name]: e.target.value });
  };

  const applyCompany = (id: string) => {
    const company = companies.find((c) => c.id === id);
    if (!company) return;
    updateSender({
      name: company.name,
      address: company.address,
      city: company.city,
      postalCode: company.postalCode,
      country: company.country,
      vatNumber: company.vatNumber,
      email: company.email,
      phone: company.phone,
    });
    setPickerOpen(false);
  };

  const sender = currentQuote.sender;

  const isAlreadySaved = companies.some(
    (c) => c.name === sender.name && c.vatNumber === sender.vatNumber && sender.name.trim() !== ''
  );

  const handleSaveCompany = async () => {
    if (!sender.name.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await addCompany(supabase, {
      label: sender.name,
      name: sender.name,
      address: sender.address,
      city: sender.city,
      postalCode: sender.postalCode,
      country: sender.country,
      vatNumber: sender.vatNumber,
      email: sender.email,
      phone: sender.phone,
    });
    setSaving(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const addCustomField = () => {
    const fields = sender.customFields || [];
    updateSender({ 
      customFields: [...fields, { id: crypto.randomUUID(), label: 'Nuovo Campo', value: '' }]
    });
  };

  const updateCustomField = (id: string, key: 'label' | 'value', newValue: string) => {
    const fields = sender.customFields || [];
    updateSender({
      customFields: fields.map(f => f.id === id ? { ...f, [key]: newValue } : f)
    });
  };

  const removeCustomField = (id: string) => {
    const fields = sender.customFields || [];
    updateSender({
      customFields: fields.filter(f => f.id !== id)
    });
  };

  return (
    <Card className="shadow-sm border-border bg-card transition-colors">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg font-bold text-card-foreground tracking-tight">Dati Mittente</CardTitle>

          <div className="flex items-center gap-2 flex-wrap">
            {sender.name.trim() && !isAlreadySaved && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveCompany}
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

          {companies.length > 0 && (
            <div className="relative" ref={pickerRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPickerOpen((v) => !v)}
                className="border-indigo-200 text-[#5c32e6] hover:bg-indigo-50 rounded-xl font-bold text-xs h-8 gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                Usa profilo salvato
                <ChevronDown className="w-3 h-3" />
              </Button>

              {pickerOpen && (
                <div className="absolute right-0 top-10 z-50 w-72 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 pt-4 pb-2 border-b border-border/50">
                    Seleziona azienda
                  </p>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {companies.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => applyCompany(company.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-card-foreground truncate">{company.label || company.name}</p>
                          {company.vatNumber && (
                            <p className="text-[11px] text-muted-foreground truncate font-medium">P.IVA {company.vatNumber}</p>
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
            <Label htmlFor="sender.name">Nome Azienda / Professionista</Label>
            <Input id="sender.name" name="name" value={sender.name} onChange={handleChange} placeholder="Es. Mario Rossi SRL" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sender.vatNumber">Partita IVA / C.F.</Label>
            <Input id="sender.vatNumber" name="vatNumber" value={sender.vatNumber} onChange={handleChange} placeholder="IT01234567890" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender.address">Indirizzo</Label>
          <Input id="sender.address" name="address" value={sender.address} onChange={handleChange} placeholder="Via Roma 1" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="sender.city">Città</Label>
            <Input id="sender.city" name="city" value={sender.city} onChange={handleChange} placeholder="Milano" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sender.postalCode">CAP</Label>
            <Input id="sender.postalCode" name="postalCode" value={sender.postalCode} onChange={handleChange} placeholder="20100" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sender.country">Paese</Label>
            <Input id="sender.country" name="country" value={sender.country} onChange={handleChange} placeholder="Italia" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sender.email">Email</Label>
            <Input id="sender.email" name="email" value={sender.email} onChange={handleChange} placeholder="info@azienda.it" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sender.phone">Telefono</Label>
            <Input id="sender.phone" name="phone" value={sender.phone} onChange={handleChange} placeholder="+39 02 1234567" />
          </div>
        </div>

        {/* Custom Fields */}
        {(sender.customFields || []).length > 0 && (
          <div className="pt-4 mt-2 border-t border-border space-y-4 font-bold text-sm">
            <h4 className="text-sm font-bold text-card-foreground">Campi Personalizzati</h4>
            {sender.customFields?.map(field => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end animate-in fade-in">
                <div className="space-y-2 flex-1 min-w-0">
                  <Label>Nome Campo</Label>
                  <Input value={field.label} onChange={e => updateCustomField(field.id, 'label', e.target.value)} placeholder="Es. Codice Ufficio" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <Label>Valore</Label>
                  <Input value={field.value} onChange={e => updateCustomField(field.id, 'value', e.target.value)} placeholder="Es. AB123" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeCustomField(field.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 self-end sm:mb-0.5 h-11 w-11 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" onClick={addCustomField} className="w-full mt-4 border-dashed border-indigo-200 text-[#5c32e6] hover:text-[#5c32e6] hover:bg-indigo-50 transition-colors">
          <Plus className="h-4 w-4 mr-2" /> Aggiungi Campo Personalizzato
        </Button>
      </CardContent>
    </Card>
  );
}
