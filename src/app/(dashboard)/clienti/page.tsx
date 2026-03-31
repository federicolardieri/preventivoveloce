"use client";

import { useState } from "react";
import { useClientStore, ClientProfile } from "@/store/clientStore";
import { useQuoteStore } from "@/store/quoteStore";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserRound,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  X,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Quote } from "@/types/quote";
import { QuoteStatusBadge } from "@/components/quotes-list/QuoteStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface CustomField {
  id: string;
  label: string;
  value: string;
}

type ClientFormData = Omit<ClientProfile, "id" | "quotesCount">;

const emptyClient: ClientFormData = {
  name: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  vatNumber: "",
  email: "",
  phone: "",
  customFields: [],
};

export default function ClientiPage() {
  const { clients, addClient, updateClient, removeClient } = useClientStore();
  const { quotesList } = useQuoteStore();
  const router = useRouter();
  const [quotesDialogClient, setQuotesDialogClient] = useState<ClientProfile | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyClient);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.vatNumber.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyClient);
    setDialogOpen(true);
  };

  const openEdit = (client: ClientProfile) => {
    setEditingId(client.id);
    setForm({
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
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const supabase = createClient();

    if (editingId) {
      await updateClient(supabase, editingId, form);
    } else {
      await addClient(supabase, form);
    }

    setSaving(false);
    setDialogOpen(false);
    setForm(emptyClient);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await removeClient(supabase, id);
    setDeleteConfirm(null);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addCustomField = () => {
    setForm((prev) => ({
      ...prev,
      customFields: [
        ...(prev.customFields ?? []),
        { id: crypto.randomUUID(), label: "", value: "" },
      ],
    }));
  };

  const updateCustomField = (id: string, key: "label" | "value", val: string) => {
    setForm((prev) => ({
      ...prev,
      customFields: (prev.customFields ?? []).map((f) =>
        f.id === id ? { ...f, [key]: val } : f
      ),
    }));
  };

  const removeCustomField = (id: string) => {
    setForm((prev) => ({
      ...prev,
      customFields: (prev.customFields ?? []).filter((f) => f.id !== id),
    }));
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Rubrica Clienti
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            {clients.length} client{clients.length !== 1 ? "i" : "e"} salvat
            {clients.length !== 1 ? "i" : "o"}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNew}
              className="gap-2 bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-xl h-11 px-6"
            >
              <Plus className="w-4 h-4" />
              Nuovo Cliente
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-black">
                {editingId ? "Modifica Cliente" : "Nuovo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Campi principali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ragione Sociale *</Label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleFieldChange}
                    placeholder="Es. Cliente Spa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Partita IVA / C.F.</Label>
                  <Input
                    name="vatNumber"
                    value={form.vatNumber}
                    onChange={handleFieldChange}
                    placeholder="IT09876543210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Indirizzo</Label>
                <Input
                  name="address"
                  value={form.address}
                  onChange={handleFieldChange}
                  placeholder="Viale delle Industrie 5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Citta</Label>
                  <Input
                    name="city"
                    value={form.city}
                    onChange={handleFieldChange}
                    placeholder="Torino"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CAP</Label>
                  <Input
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleFieldChange}
                    placeholder="10100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paese</Label>
                  <Input
                    name="country"
                    value={form.country}
                    onChange={handleFieldChange}
                    placeholder="Italia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    name="email"
                    value={form.email}
                    onChange={handleFieldChange}
                    placeholder="info@cliente.it"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={handleFieldChange}
                    placeholder="+39 011 7654321"
                  />
                </div>
              </div>

              {/* Campi personalizzati */}
              {(form.customFields ?? []).length > 0 && (
                <div className="pt-2 space-y-3 border-t border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Campi Personalizzati
                  </p>
                  {(form.customFields as CustomField[]).map((field) => (
                    <div key={field.id} className="flex gap-2 items-end">
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-xs">Nome campo</Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            updateCustomField(field.id, "label", e.target.value)
                          }
                          placeholder="Es. SDI / PEC"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-xs">Valore</Label>
                        <Input
                          value={field.value}
                          onChange={(e) =>
                            updateCustomField(field.id, "value", e.target.value)
                          }
                          placeholder="Es. M5UXCR1"
                          className="h-9"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.id)}
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors mb-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addCustomField}
                className="w-full border-dashed font-bold text-primary hover:bg-primary/5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Campo Personalizzato
              </Button>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 px-6"
                >
                  {saving
                    ? "Salvo..."
                    : editingId
                    ? "Salva Modifiche"
                    : "Aggiungi Cliente"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome, email, P.IVA o citta..."
            className="pl-10 h-11 rounded-xl"
          />
        </div>
      )}

      {/* Empty state */}
      {clients.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <UserRound className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">
            Nessun cliente salvato
          </h2>
          <p className="text-muted-foreground font-medium max-w-sm mx-auto">
            Salva i tuoi clienti per riutilizzare i loro dati nei preventivi
            senza doverli reinserire ogni volta.
          </p>
        </div>
      )}

      {filtered.length === 0 && clients.length > 0 && (
        <p className="text-center text-muted-foreground font-medium py-10">
          Nessun risultato per &quot;{search}&quot;
        </p>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((client) => (
          <Card
            key={client.id}
            className="group relative hover:shadow-lg transition-all border-border bg-card overflow-hidden"
          >
            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEdit(client)}
                className="p-2 rounded-xl bg-muted hover:bg-primary/10 transition-colors"
                title="Modifica"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
              </button>
              {deleteConfirm === client.id ? (
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors text-xs font-bold px-3"
                >
                  Conferma
                </button>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(client.id)}
                  className="p-2 rounded-xl bg-muted hover:bg-red-50 transition-colors"
                  title="Elimina"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                </button>
              )}
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <UserRound className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1 pr-16">
                  <CardTitle className="text-base font-black text-card-foreground truncate leading-tight">
                    {client.name}
                  </CardTitle>
                  {client.vatNumber && (
                    <p className="text-xs text-muted-foreground font-bold mt-0.5 truncate">
                      P.IVA {client.vatNumber}
                    </p>
                  )}
                  {(() => {
                    const count = quotesList.filter(q => q.clientId === client.id).length;
                    return count > 0 ? (
                      <button
                        onClick={() => setQuotesDialogClient(client)}
                        className="flex items-center gap-1 mt-1.5 group/qlink cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-primary/60" />
                        <span className="text-xs font-bold text-primary/70 group-hover/qlink:text-primary group-hover/qlink:underline transition-colors">
                          {count} preventiv{count !== 1 ? "i" : "o"}
                        </span>
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-2.5">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium">{client.phone}</span>
                </div>
              )}
              {(client.city || client.country) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium">
                    {client.city}
                    {client.postalCode ? ` (${client.postalCode})` : ""}
                    {client.country ? `, ${client.country}` : ""}
                  </span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium">{client.address}</span>
                </div>
              )}

              {/* Campi personalizzati */}
              {(client.customFields ?? []).length > 0 && (
                <div className="pt-2 border-t border-border space-y-1">
                  {(client.customFields as CustomField[]).map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground font-bold truncate">
                        {f.label}
                      </span>
                      <span className="font-mono text-foreground/70 truncate text-right">
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog preventivi del cliente */}
      <Dialog open={!!quotesDialogClient} onOpenChange={(open) => { if (!open) setQuotesDialogClient(null); }}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          {/* Header colorato */}
          <div className="relative bg-gradient-to-br from-primary to-purple-700 px-6 pt-6 pb-8 overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                <UserRound className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-black text-white tracking-tight">
                {quotesDialogClient?.name}
              </DialogTitle>
              {quotesDialogClient?.vatNumber && (
                <p className="text-white/60 text-xs font-bold mt-0.5">P.IVA {quotesDialogClient.vatNumber}</p>
              )}
              {(() => {
                const count = quotesList.filter(q => q.clientId === quotesDialogClient?.id).length;
                return (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                    <FileText className="w-3 h-3 text-white" />
                    <span className="text-xs font-black text-white">{count} preventiv{count !== 1 ? "i" : "o"} collegat{count !== 1 ? "i" : "o"}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Lista preventivi */}
          <div className="px-4 py-3 max-h-[380px] overflow-y-auto">
            {(() => {
              const clientQuotes: Quote[] = quotesList
                .filter(q => q.clientId === quotesDialogClient?.id)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              if (clientQuotes.length === 0) {
                return (
                  <div className="py-10 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Nessun preventivo collegato.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-1.5 py-1">
                  {clientQuotes.map((q) => {
                    const total = q.items.reduce((sum, item) => {
                      const base = item.unitPrice * item.quantity;
                      const disc = item.discountType === "fixed" ? (item.discount || 0) : base * ((item.discount || 0) / 100);
                      const sub = Math.max(0, base - disc);
                      return sum + sub + sub * (item.vatRate / 100);
                    }, 0);
                    return (
                      <button
                        key={q.id}
                        onClick={() => { setQuotesDialogClient(null); router.push(`/preventivi/${q.id}`); }}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-black text-foreground">{q.number}</p>
                            <p className="text-xs text-muted-foreground font-medium">
                              {format(new Date(q.createdAt), "dd MMM yyyy", { locale: it })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <QuoteStatusBadge status={q.status} />
                          <span className="text-sm font-black text-foreground">{formatCurrency(total)}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
