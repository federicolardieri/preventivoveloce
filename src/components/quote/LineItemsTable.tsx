"use client";

import { useQuoteStore } from "@/store/quoteStore";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Settings2, X, Sparkles, Loader2 } from "lucide-react";
import { QuoteItem, VatRate } from "@/types/quote";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function LineItemsTable() {
  const { currentQuote, addItem, removeItem, updateItem } = useQuoteStore();
  const [improvingId, setImprovingId] = useState<string | null>(null);

  if (!currentQuote) return null;

  const handleImproveCopy = async (id: string, currentText: string) => {
    if (!currentText || currentText.trim().length < 2) return;
    
    setImprovingId(id);
    try {
      const res = await fetch('/api/ai/improve-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText }),
      });
      
      const data = await res.json();
      if (data.improvedText) {
        handleUpdate(id, 'description', data.improvedText);
      }
    } catch (error) {
      console.error('Failed to improve copy:', error);
    } finally {
      setImprovingId(null);
    }
  };

  const handleAddNewItem = () => {
    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      vatRate: 22
    };
    addItem(newItem);
  };

  const handleUpdate = (id: string, field: keyof QuoteItem, value: string | number) => {
    updateItem(id, { [field]: value });
  };

  const handleCustomFieldUpdate = (itemId: string, fieldId: string, value: string) => {
    const item = currentQuote.items.find(i => i.id === itemId);
    if (!item) return;
    const customFields = item.customFields || {};
    updateItem(itemId, { customFields: { ...customFields, [fieldId]: value } });
  };

  const addCustomColumn = (label: string) => {
    if (!label.trim()) return;
    const { updateDetails } = useQuoteStore.getState();
    const cols = currentQuote.itemCustomColumns || [];
    updateDetails({ itemCustomColumns: [...cols, { id: crypto.randomUUID(), label }] });
  };

  const removeCustomColumn = (colId: string) => {
    const { updateDetails } = useQuoteStore.getState();
    const cols = currentQuote.itemCustomColumns || [];
    updateDetails({ itemCustomColumns: cols.filter(c => c.id !== colId) });
  };

  const getCurrencySymbol = (currency: string) => {
    if (currency === 'USD') return '$';
    if (currency === 'GBP') return '£';
    if (currency === 'CHF') return 'CHF';
    return '€';
  };

  const customCols = currentQuote.itemCustomColumns || [];

  return (
    <div className="space-y-6">
      {currentQuote.items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-muted/30 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
             <Plus className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium text-lg">Nessuna voce aggiunta.</p>
          <p className="text-sm text-muted-foreground/80 mt-1">Clicca su Aggiungi Riga o chiedi all'IA di compilarlo per te.</p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {currentQuote.items.map((item, index) => {
            const lineBase = item.unitPrice * item.quantity;
            const discountVal = item.discountType === 'fixed' ? (item.discount || 0) : lineBase * ((item.discount || 0) / 100);
            const lineSubtotal = Math.max(0, lineBase - discountVal);
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl md:rounded-3xl border border-border/60 bg-muted/10 p-4 sm:p-5 md:p-6 transition-all duration-300 hover:border-primary/30 hover:bg-muted/30 hover:shadow-sm"
              >
                {/* Header riga: numero + totale + elimina */}
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                      {index + 1}
                    </span>
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      Voce Preventivo
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Totale Riga</p>
                      <p className="text-sm md:text-base font-black text-card-foreground leading-none">
                        {formatCurrency(lineSubtotal)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-11 w-11 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Descrizione */}
                  <div className="sm:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">
                      Descrizione
                    </Label>
                    <div className="relative group/desc">
                      <Input
                        value={item.description}
                        onChange={(e) => handleUpdate(item.id, 'description', e.target.value)}
                        placeholder="Descrivi il servizio o prodotto..."
                        className="h-11 rounded-xl border-border/80 bg-background focus-visible:ring-primary/20 font-medium pl-4 pr-24 text-base shadow-sm w-full transition-all"
                      />
                      <div className="absolute right-1.5 top-1.5 bottom-1.5 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost" 
                          size="sm"
                          disabled={improvingId === item.id || !item.description || item.description.length < 3}
                          onClick={() => handleImproveCopy(item.id, item.description)}
                          className="h-8 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 px-2.5 transition-all shadow-sm"
                        >
                          {improvingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          <span className="hidden xs:inline">Migliora</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Quantità */}
                  <div className="col-span-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">
                      Quantità
                    </Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => handleUpdate(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="h-11 rounded-xl border-border/80 bg-background focus-visible:ring-primary/20 px-4 shadow-sm font-semibold w-full"
                    />
                  </div>

                  {/* Prezzo Unit. */}
                  <div className="col-span-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">
                      Prezzo Unit. ({getCurrencySymbol(currentQuote.currency)})
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice / 100 || ''}
                      onChange={(e) => handleUpdate(item.id, 'unitPrice', Math.round((parseFloat(e.target.value) || 0) * 100))}
                      className="h-11 rounded-xl border-border/80 bg-background focus-visible:ring-primary/20 px-4 shadow-sm font-semibold w-full"
                    />
                  </div>

                  {/* Sconto */}
                  <div className="col-span-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">
                      Sconto
                    </Label>
                    <div className="flex items-center gap-1.5 w-full">
                      <Input
                        type="number"
                        min="0"
                        step={item.discountType === 'fixed' ? "0.01" : "1"}
                        value={item.discountType === 'fixed' ? (item.discount / 100 || '') : (item.discount || '')}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleUpdate(item.id, 'discount', item.discountType === 'fixed' ? Math.round(val * 100) : val);
                        }}
                        className="h-11 rounded-xl border-border/80 bg-background focus-visible:ring-primary/20 px-4 shadow-sm font-semibold flex-1 min-w-0"
                      />
                      <Select
                        value={item.discountType || 'percentage'}
                        onValueChange={(val: 'percentage' | 'fixed') => {
                          handleUpdate(item.id, 'discountType', val);
                          handleUpdate(item.id, 'discount', 0);
                        }}
                      >
                        <SelectTrigger className="h-11 w-[70px] rounded-xl px-2.5 font-bold text-xs bg-muted/50 border-border/80 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="percentage"> % </SelectItem>
                          <SelectItem value="fixed">{getCurrencySymbol(currentQuote.currency)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* IVA */}
                  <div className="col-span-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">
                      IVA
                    </Label>
                    <Select
                      value={item.vatRate.toString()}
                      onValueChange={(val: string) => handleUpdate(item.id, 'vatRate', parseInt(val, 10) as VatRate)}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/80 bg-background shadow-sm font-semibold w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="22">22%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="4">4%</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Colonne personalizzate */}
                {customCols.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 mt-5 pt-5 border-t border-border/50">
                    {customCols.map(col => (
                      <div key={col.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            {col.label}
                          </Label>
                          {index === 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCustomColumn(col.id)}
                              className="h-5 w-5 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors flex items-center justify-center -mr-1"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={item.customFields?.[col.id] || ''}
                          onChange={(e) => handleCustomFieldUpdate(item.id, col.id, e.target.value)}
                          placeholder="..."
                          className="h-11 rounded-xl border-primary/20 bg-primary/5 focus-visible:ring-primary/40 text-card-foreground font-medium w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pulsanti Azione */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 mt-8">
        <Button 
          onClick={handleAddNewItem} 
          className="flex-1 h-14 rounded-2xl border-dashed border-2 bg-transparent text-[#5c32e6] hover:text-white hover:bg-[#5c32e6] border-[#5c32e6]/50 hover:border-[#5c32e6] transition-all shadow-none font-bold text-base group"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuova Riga
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 h-14 rounded-2xl border-dashed border-2 text-muted-foreground hover:bg-muted/50 transition-all font-bold group">
              <Settings2 className="mr-2 h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              Aggiungi Colonna
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-6 bg-card border-border shadow-2xl rounded-3xl" align="end" sideOffset={10}>
            <div className="space-y-5">
              <div>
                <h4 className="font-black text-card-foreground tracking-tight text-xl">Nuova Colonna</h4>
                <p className="text-xs text-muted-foreground font-medium mt-1">Un campo extra per ogni riga (es. "Codice EAN").</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Colonna</Label>
                <Input id="newColLabel" placeholder="Es. Codice Articolo" className="h-11 rounded-xl bg-muted/30 focus-visible:ring-primary/20" />
              </div>
              <Button className="w-full bg-[#5c32e6] hover:bg-[#4b27cb] text-white font-black h-12 rounded-xl shadow-lg shadow-primary/20 transition-all" onClick={() => {
                const input = document.getElementById('newColLabel') as HTMLInputElement;
                addCustomColumn(input.value);
                input.value = '';
              }}>
                Conferma Aggiunta
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
