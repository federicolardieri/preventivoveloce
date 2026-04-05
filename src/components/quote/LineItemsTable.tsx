"use client";

import { useQuoteStore } from "@/store/quoteStore";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Settings2, X } from "lucide-react";
import { QuoteItem, VatRate } from "@/types/quote";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

export function LineItemsTable() {
  const { currentQuote, addItem, removeItem, updateItem } = useQuoteStore();

  if (!currentQuote) return null;

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
    <Card className="shadow-sm border-border bg-card transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold text-card-foreground tracking-tight">Voci Preventivo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentQuote.items.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground font-medium italic border border-dashed border-border rounded-xl">
            Nessuna voce aggiunta. Inizia a compilare o chiedi all&apos;AI.
          </div>
        ) : (
          <div className="space-y-3">
            {currentQuote.items.map((item, index) => {
              const lineBase = item.unitPrice * item.quantity;
              const discountVal = item.discountType === 'fixed' ? (item.discount || 0) : lineBase * ((item.discount || 0) / 100);
              const lineSubtotal = Math.max(0, lineBase - discountVal);
              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-border bg-card/50 p-4 transition-colors hover:border-primary/20"
                >
                  {/* Header riga: numero + totale + elimina */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      Voce {index + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-card-foreground">
                        Totale: {formatCurrency(lineSubtotal)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Descrizione — larghezza piena */}
                  <div className="mb-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Descrizione
                    </Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleUpdate(item.id, 'description', e.target.value)}
                      placeholder="Descrizione servizio/prodotto"
                      className="h-9 border-border bg-card focus-visible:ring-primary/20 font-medium"
                    />
                  </div>

                  {/* Campi numerici in griglia responsive */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                        Quantità
                      </Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity || ''}
                        onChange={(e) => handleUpdate(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="h-9 text-right"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                        Prezzo Unit. ({getCurrencySymbol(currentQuote.currency)})
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice / 100 || ''}
                        onChange={(e) => handleUpdate(item.id, 'unitPrice', Math.round((parseFloat(e.target.value) || 0) * 100))}
                        className="h-9 text-right"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                        Sconto
                      </Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          step={item.discountType === 'fixed' ? "0.01" : "1"}
                          value={item.discountType === 'fixed' ? (item.discount / 100 || '') : (item.discount || '')}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleUpdate(item.id, 'discount', item.discountType === 'fixed' ? Math.round(val * 100) : val);
                          }}
                          className="h-9 text-right"
                        />
                        <Select
                          value={item.discountType || 'percentage'}
                          onValueChange={(val: 'percentage' | 'fixed') => {
                            handleUpdate(item.id, 'discountType', val);
                            handleUpdate(item.id, 'discount', 0);
                          }}
                        >
                          <SelectTrigger className="h-9 w-[55px] px-2 font-black text-[10px] bg-muted/50 border-border shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage"> % </SelectItem>
                            <SelectItem value="fixed">{getCurrencySymbol(currentQuote.currency)}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                        IVA
                      </Label>
                      <Select
                        value={item.vatRate.toString()}
                        onValueChange={(val: string) => handleUpdate(item.id, 'vatRate', parseInt(val, 10) as VatRate)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border/50">
                      {customCols.map(col => (
                        <div key={col.id}>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {col.label}
                            </Label>
                            {index === 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCustomColumn(col.id)}
                                className="h-4 w-4 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                              >
                                <X className="h-2.5 w-2.5" />
                              </Button>
                            )}
                          </div>
                          <Input
                            value={item.customFields?.[col.id] || ''}
                            onChange={(e) => handleCustomFieldUpdate(item.id, col.id, e.target.value)}
                            placeholder={col.label}
                            className="h-9 border-primary/10 bg-primary/5 focus-visible:ring-primary/20 text-card-foreground"
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

        <div className="flex items-center gap-3">
          <Button onClick={handleAddNewItem} variant="outline" className="flex-1 border-dashed border-2 py-6 text-[#5c32e6] hover:text-white hover:bg-[#5c32e6] hover:border-[#5c32e6] transition-all font-bold">
            <Plus className="mr-2 h-4 w-4" /> Aggiungi Riga
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-full py-6 px-6 border-dashed border-2 text-primary hover:bg-primary hover:text-primary-foreground border-primary/50 transition-all font-black group rounded-xl">
                <Settings2 className="mr-2 h-5 w-5" /> Aggiungi Colonna
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-5 bg-card border-border shadow-2xl rounded-2xl" align="end">
              <div className="space-y-4">
                <h4 className="font-black text-card-foreground tracking-tight text-lg">Nuova Colonna</h4>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">Aggiungi un campo dati extra ad ogni singola riga di questo preventivo.</p>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Colonna</Label>
                  <Input id="newColLabel" placeholder="Es. Codice Articolo" className="h-10 rounded-xl" />
                </div>
                <Button className="w-full bg-primary hover:opacity-90 font-black h-11 rounded-xl shadow-lg shadow-primary/20" onClick={() => {
                  const input = document.getElementById('newColLabel') as HTMLInputElement;
                  addCustomColumn(input.value);
                  input.value = '';
                }}>
                  Conferma
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
