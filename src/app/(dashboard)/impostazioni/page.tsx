// TEMPORARILY DISABLED — tutto il contenuto originale è sotto
// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Building2, CreditCard, Plus, Trash2, ChevronDown, ChevronUp, Check, Zap, Crown, Sparkles, AlertCircle, User, Camera, Mail, Phone, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileStore, CompanyProfile } from "@/store/profileStore";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "w-full h-11 rounded-xl border border-border px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground font-medium bg-muted/30 text-sm transition-colors";

type FormData = Omit<CompanyProfile, 'id'>;

const emptyForm = (): FormData => ({
  label: '',
  name: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Italia',
  vatNumber: '',
  email: '',
  phone: '',
});

// ── Company Card ────────────────────────────────────────────────────────
function CompanyCard({
  company,
  onSave,
  onDelete,
  defaultOpen = false,
}: {
  company: CompanyProfile;
  onSave: (data: Partial<Omit<CompanyProfile, 'id'>>) => Promise<void>;
  onDelete: () => Promise<void>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [form, setForm] = useState<FormData>({ ...company });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-colors">
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-card-foreground truncate">{company.label || company.name || 'Azienda senza nome'}</p>
          {company.vatNumber && (
            <p className="text-xs text-muted-foreground font-medium">P.IVA {company.vatNumber}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </div>

      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nome nel picker</label>
              <input name="label" value={form.label} onChange={handleChange} placeholder="Es. Acme SRL (principale)" className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ragione Sociale</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Acme SRL" className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Partita IVA / C.F.</label>
              <input name="vatNumber" value={form.vatNumber} onChange={handleChange} placeholder="01234567890" className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Indirizzo</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Via Roma 1" className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Città</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Milano" className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">CAP</label>
              <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="20100" className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Paese</label>
              <input name="country" value={form.country} onChange={handleChange} placeholder="Italia" className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Telefono</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+39 02 1234567" className={INPUT_CLASS} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Email</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="info@azienda.it" className={INPUT_CLASS} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90 rounded-xl h-10 font-bold flex items-center gap-2 justify-center">
            {saved ? <><Check className="w-4 h-4" /> Salvato</> : saving ? 'Salvataggio...' : 'Salva Azienda'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Utility: estrae area croppata da react-easy-crop e restituisce Blob ─
function getCroppedBlob(imageSrc: string, cropArea: Area, size = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        image,
        cropArea.x, cropArea.y,
        cropArea.width, cropArea.height,
        0, 0, size, size,
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob fallito'))),
        'image/jpeg',
        0.88,
      );
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

// ── Profile Section ───────────────────────────────────────────────────
function ProfiloSection({ user, onUpdate }: { user: any, onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [uploading, setUploading] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);

  // Sincronizza i campi quando i dati del profilo arrivano dal DB
  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
    if (user?.phoneNumber) setPhone(user.phoneNumber);
  }, [user?.fullName, user?.phoneNumber]);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  // ref per avere sempre l'ultimo valore senza dipendere dalla closure
  const croppedAreaPixelsRef = useRef<Area | null>(null);

  const supabase = createClient();

  const handleSave = async () => {
    setLoading(true);

    // 1. Update public.profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phone,
      })
      .eq('id', user.id);

    // 2. Update auth.users metadata (Authentication section)
    // We update 'data' (metadata) instead of the core 'phone' field 
    // to avoid the "Unable to get SMS provider" error in Supabase configs
    // that don't have an SMS provider (like Twilio) set up.
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        phone_number: phone,
        phone: phone // still visible in metadata
      }
    });

    setLoading(false);
    if (!profileError && !authError) {
      setSuccess(true);
      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } else if (authError) {
      console.error("Auth update error:", authError);
      // In some Supabase configs, updating phone triggers an SMS.
      // If it fails (e.g. no provider), we still want the profile to be updated if possible.
      if (!profileError) {
        setSuccess(true);
        onUpdate();
        setTimeout(() => setSuccess(false), 3000);
      }
    }
  };

  // Apre il modal di crop quando l'utente seleziona un file
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // Eseguito quando l'utente conferma il crop nel modal
  const handleCropConfirm = async () => {
    const pixels = croppedAreaPixelsRef.current;
    if (!cropSrc || !pixels) return;
    setUploading(true);
    setCropSrc(null);
    try {
      const blob = await getCroppedBlob(cropSrc, pixels, 400);
      URL.revokeObjectURL(cropSrc);
      const filePath = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;
      onUpdate();
    } catch (err) {
      console.error("Errore upload:", err);
      alert("Errore durante l'upload della foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.avatarUrl) return;
    setDeletingAvatar(true);
    try {
      // Estrai il path relativo all'interno del bucket (dopo "/avatars/")
      const match = user.avatarUrl.match(/\/avatars\/(.+)$/);
      if (match?.[1]) {
        await supabase.storage.from('avatars').remove([decodeURIComponent(match[1])]);
      }
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error("Errore eliminazione avatar:", err);
      alert("Errore durante l'eliminazione della foto");
    } finally {
      setDeletingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Modal Crop Avatar ── */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Ritaglia la foto</h3>
              <button onClick={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); }} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="px-6 pb-2 text-xs text-muted-foreground">
              Trascina per posizionare · Usa lo slider per zoomare
            </p>

            {/* Area crop */}
            <div className="relative w-full bg-black" style={{ height: 320 }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                minZoom={0.2}
                maxZoom={5}
                aspect={1}
                cropShape="round"
                showGrid={false}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_: Area, pixels: Area) => {
                  croppedAreaPixelsRef.current = pixels;
                  setCroppedAreaPixels(pixels);
                }}
                style={{
                  cropAreaStyle: {
                    border: '3px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                  },
                }}
              />
            </div>

            {/* Zoom */}
            <div className="px-6 pt-4 flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="range" min={0.2} max={5} step={0.01} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>

            <div className="px-6 py-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); }}
                className="flex-1 rounded-xl h-11 font-bold"
              >
                Annulla
              </Button>
              <Button
                onClick={handleCropConfirm}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-11 font-bold"
              >
                Usa questa foto
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl md:rounded-3xl border border-border p-4 md:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6">Il Tuo Profilo</h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="relative group shrink-0 mx-auto md:mx-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 shadow-xl bg-muted">
              {(uploading || deletingAvatar) ? (
                <div className="w-full h-full flex items-center justify-center bg-white/50 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <User className="w-12 h-12 text-primary/30" />
                </div>
              )}
            </div>

            {/* Camera: cambia foto — sempre in basso a destra */}
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-all border-4 border-white group-hover:scale-110">
              <Camera className="w-5 h-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading || deletingAvatar} />
            </label>

            {/* X: elimina foto — appare al hover in alto a destra, solo se c'è un avatar */}
            {user?.avatarUrl && (
              <button
                onClick={handleDeleteAvatar}
                disabled={deletingAvatar || uploading}
                className="absolute top-0 right-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                title="Rimuovi foto"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Nome Completo
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 opacity-50">
                  <Mail className="w-3 h-3" /> Email (non modificabile)
                </label>
                <input
                  value={user?.email || ""}
                  disabled
                  className={cn(INPUT_CLASS, "opacity-50 cursor-not-allowed")}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Numero di Telefono
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Es. +39 340 1234567"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading || (fullName === user?.fullName && phone === user?.phoneNumber)}
              className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-8 font-bold flex items-center gap-2 mt-4 transition-all active:scale-95"
            >
              {success ? <><Check className="w-4 h-4" /> Salvato</> : loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salva Profilo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Plan data ───────────────────────────────────────────────────────────
interface PlanInfo {
  plan: string;
  creditsRemaining: number | null;
  creditsTotal: number | null;
  planExpiresAt: string | null;
}

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '0',
    period: 'per sempre',
    credits: '1 preventivo totale',
    features: ['1 preventivo', 'Template Classic e Bold', 'Watermark sul PDF', 'Assistente AI base'],
    icon: Zap,
    color: 'border-border',
    badge: '',
  },
  {
    id: 'starter' as const,
    name: 'Starter',
    price: '9,90',
    period: '/mese',
    credits: '10 preventivi al mese',
    features: ['10 preventivi/mese', 'Tutti i template', 'PDF senza watermark', 'Assistente AI avanzato', 'Allegati PDF'],
    icon: Sparkles,
    color: 'border-primary/30',
    badge: 'Popolare',
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '29',
    period: '/mese',
    credits: 'Preventivi illimitati',
    features: ['Preventivi illimitati', 'Tutti i template PRO', 'PDF senza watermark', 'AI illimitata', 'Allegati illimitati', 'Supporto prioritario'],
    icon: Crown,
    color: 'border-amber-400/40',
    badge: 'Per professionisti',
  },
];

type SettingsSection = 'profilo' | 'aziende' | 'piano';

// ── Main Page ───────────────────────────────────────────────────────────
function ImpostazioniPageInner() {
  const { companies, addCompany, updateCompany, removeCompany } = useProfileStore();
  const [newCardOpen, setNewCardOpen] = useState(false);
  const [newForm, setNewForm] = useState<FormData>(emptyForm());
  const [adding, setAdding] = useState(false);
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    (searchParams.get('tab') as SettingsSection) || 'profilo'
  );

  // User & Plan state
  const [userInfo, setUserInfo] = useState<any>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    const res = await fetch('/api/plan');
    if (res.ok) setPlanInfo(await res.json());

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserInfo({
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || user.user_metadata?.full_name || "",
        phoneNumber: profile?.phone_number || "",
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || "",
        plan: profile?.plan || 'free'
      });
    }
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleNewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddCompany = async () => {
    if (!newForm.name.trim() && !newForm.label.trim()) return;
    setAdding(true);
    await addCompany(supabase, { ...newForm, label: newForm.label || newForm.name });
    setAdding(false);
    setNewForm(emptyForm());
    setNewCardOpen(false);
  };

  const handleChangePlan = async (plan: string) => {
    setChangingPlan(plan);
    setPlanSuccess(null);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        await loadData();
        router.refresh();
        setPlanSuccess(`Piano ${plan === 'pro' ? 'Pro' : plan === 'starter' ? 'Starter' : 'Free'} attivato!`);
        setTimeout(() => setPlanSuccess(null), 4000);
      }
    } finally {
      setChangingPlan(null);
    }
  };

  const NAV_ITEMS = [
    { id: 'profilo' as const, label: "Mio Profilo", icon: User },
    { id: 'aziende' as const, label: "Dati Aziendali", icon: Building2 },
    { id: 'piano' as const, label: "Piano e Fatturazione", icon: CreditCard },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 md:p-8 rounded-3xl shadow-sm border border-border transition-colors">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Impostazioni</h1>
          <p className="text-muted-foreground font-medium mt-1">Gestisci il tuo profilo, le aziende e il piano.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">

        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-card rounded-3xl p-4 shadow-sm border border-border transition-colors">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold cursor-pointer transition-colors w-full text-left ${activeSection === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.id === 'piano' && planInfo && (
                  <span className="ml-auto text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {planInfo.plan}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-4">

          {/* ═══════════════════════ SEZIONE PROFILO ═══════════════════════ */}
          {activeSection === 'profilo' && (
            <ProfiloSection user={userInfo} onUpdate={async () => { await loadData(); router.refresh(); }} />
          )}

          {/* ═══════════════════════ SEZIONE AZIENDE ═══════════════════════ */}
          {activeSection === 'aziende' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Aziende Salvate</h2>
                  <p className="text-sm text-muted-foreground">{companies.length} aziend{companies.length === 1 ? 'a' : 'e'} salvat{companies.length === 1 ? 'a' : 'e'}</p>
                </div>
                <Button onClick={() => setNewCardOpen(true)} className="bg-primary hover:bg-primary/90 rounded-xl h-10 font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Nuova Azienda
                </Button>
              </div>

              {companies.length === 0 && !newCardOpen && (
                <div className="bg-card rounded-2xl border border-dashed border-border p-10 text-center transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-bold text-foreground mb-1">Nessuna azienda salvata</p>
                  <p className="text-sm text-muted-foreground mb-4">Aggiungi i dati della tua azienda per pre-compilare i preventivi.</p>
                  <Button onClick={() => setNewCardOpen(true)} variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 rounded-xl font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Aggiungi la prima azienda
                  </Button>
                </div>
              )}

              {companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onSave={(data) => updateCompany(supabase, company.id, data)}
                  onDelete={() => removeCompany(supabase, company.id)}
                />
              ))}

              {newCardOpen && (
                <div className="bg-card rounded-2xl border border-primary/20 shadow-sm overflow-hidden transition-colors">
                  <div className="px-5 py-4 bg-primary/5 border-b border-primary/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <Plus className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <p className="font-bold text-foreground">Nuova Azienda</p>
                  </div>
                  <div className="px-5 pb-5 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nome nel picker</label>
                        <input name="label" value={newForm.label} onChange={handleNewChange} placeholder="Es. Acme SRL (principale)" className={INPUT_CLASS} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ragione Sociale *</label>
                        <input name="name" value={newForm.name} onChange={handleNewChange} placeholder="Acme SRL" className={INPUT_CLASS} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Partita IVA / C.F.</label>
                        <input name="vatNumber" value={newForm.vatNumber} onChange={handleNewChange} placeholder="01234567890" className={INPUT_CLASS} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Indirizzo</label>
                        <input name="address" value={newForm.address} onChange={handleNewChange} placeholder="Via Roma 1" className={INPUT_CLASS} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Città</label>
                        <input name="city" value={newForm.city} onChange={handleNewChange} placeholder="Milano" className={INPUT_CLASS} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">CAP</label>
                        <input name="postalCode" value={newForm.postalCode} onChange={handleNewChange} placeholder="20100" className={INPUT_CLASS} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Paese</label>
                        <input name="country" value={newForm.country} onChange={handleNewChange} placeholder="Italia" className={INPUT_CLASS} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Telefono</label>
                        <input name="phone" value={newForm.phone} onChange={handleNewChange} placeholder="+39 02 1234567" className={INPUT_CLASS} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Email</label>
                        <input name="email" value={newForm.email} onChange={handleNewChange} placeholder="info@azienda.it" className={INPUT_CLASS} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleAddCompany} disabled={!newForm.name.trim() || adding} className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-10 font-bold">
                        {adding ? 'Salvataggio...' : 'Salva Azienda'}
                      </Button>
                      <Button onClick={() => { setNewCardOpen(false); setNewForm(emptyForm()); }} variant="outline" className="rounded-xl h-10 font-bold border-border">
                        Annulla
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════════════ SEZIONE PIANO E FATTURAZIONE ═══════════════════ */}
          {activeSection === 'piano' && (
            <>
              {/* Current plan status */}
              {planInfo && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">Il tuo piano attuale</h2>
                    <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-black px-3 py-1 rounded-full uppercase">
                      <Zap className="w-3.5 h-3.5" />
                      {planInfo.plan}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Crediti</p>
                      <p className="text-2xl font-black text-foreground">
                        {planInfo.creditsRemaining === null ? '∞' : planInfo.creditsRemaining}
                        {planInfo.creditsTotal !== null && (
                          <span className="text-sm text-muted-foreground font-bold"> / {planInfo.creditsTotal}</span>
                        )}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Piano</p>
                      <p className="text-2xl font-black text-foreground capitalize">{planInfo.plan}</p>
                    </div>
                    {planInfo.planExpiresAt && (
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Scadenza</p>
                        <p className="text-lg font-black text-foreground">
                          {new Date(planInfo.planExpiresAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Success banner */}
              {planSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-emerald-800">{planSuccess}</p>
                </div>
              )}

              {/* Test mode banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Modalità test</p>
                  <p className="text-xs text-amber-700 mt-0.5">I pagamenti non sono ancora attivi. Cambiare piano qui è gratuito e immediato per testare la logica dei crediti.</p>
                </div>
              </div>

              {/* Plans grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((p) => {
                  const isCurrent = planInfo?.plan === p.id;
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.id}
                      className={`bg-card rounded-2xl border-2 p-6 flex flex-col transition-all ${isCurrent ? 'border-primary shadow-lg shadow-primary/10' : p.color
                        }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        {p.badge && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Attivo
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-foreground">{p.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1 mb-3">
                        <span className="text-3xl font-black text-foreground">{p.price}€</span>
                        <span className="text-sm text-muted-foreground font-medium">{p.period}</span>
                      </div>

                      <p className="text-xs font-bold text-primary mb-4">{p.credits}</p>

                      <ul className="space-y-2 mb-6 flex-1">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleChangePlan(p.id)}
                        disabled={isCurrent || changingPlan !== null}
                        variant={isCurrent ? "outline" : "default"}
                        className={`w-full rounded-xl h-11 font-bold transition-all ${isCurrent
                          ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                          : 'bg-primary hover:bg-primary/90'
                          }`}
                      >
                        {changingPlan === p.id
                          ? 'Attivazione...'
                          : isCurrent
                            ? 'Piano attuale'
                            : p.id === 'free'
                              ? 'Passa a Free'
                              : `Attiva ${p.name}`
                        }
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ImpostazioniPage() {
  return (
    <Suspense fallback={null}>
      <ImpostazioniPageInner />
    </Suspense>
  );
}
