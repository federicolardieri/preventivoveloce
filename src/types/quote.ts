export type VatRate = 0 | 4 | 10 | 22;
export type QuoteStatus = 'bozza' | 'da_inviare' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto';
export type TemplateId = 'classic' | 'modern' | 'minimal' | 'bold' | 'corporate' | 'creative' | 'cover-page' | 'executive';
export type FontFamily = 'Helvetica' | 'Times-Roman' | 'Courier';
export type TableStyle = 'striped' | 'bordered' | 'minimal';
export type LogoPosition = 'left' | 'center' | 'right';
export type LogoShape = 'original' | 'circle' | 'square';

export const PRO_TEMPLATES: TemplateId[] = ['cover-page', 'executive'];

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;     // in centesimi
  discount: number;      // percentuale o importo fisso (centesimi)
  discountType?: 'percentage' | 'fixed'; // V4 additions
  vatRate: VatRate;
  customFields?: Record<string, string>; // Maps custom column IDs to string values
}

export interface QuoteTheme {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: FontFamily;
  tableStyle: TableStyle;
  logoPosition: LogoPosition;
  logoShape?: LogoShape;
  logoScale?: number;
  logoOffsetX?: number;  // offset orizzontale in pt (positivo = destra)
  logoOffsetY?: number;  // offset verticale in pt (positivo = basso)
  logoPadding?: number;  // padding interno alla forma (0–0.5); negativo = taglia i bordi
  showFooterNotes: boolean;
  showPaymentTerms: boolean;
}

export interface ContactInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  vatNumber: string;
  email: string;
  phone: string;
  logo?: string;         // Processed base64 (cropped/scaled for PDF)
  logoOriginal?: string; // Source base64 (unmodified)
  customFields?: { id: string; label: string; value: string }[]; // V4 extra sender/client fields
}

export interface QuoteAttachment {
  id: string;
  name: string;
  data: string; // Base64 data URI
  type: 'application/pdf' | 'image/jpeg' | 'image/png';
}

export interface Quote {
  id: string;
  number: string;        // "PRV-2026-001"
  status: QuoteStatus;
  template: TemplateId;
  theme: QuoteTheme;
  sender: ContactInfo;
  client: Omit<ContactInfo, 'logo'>;
  items: QuoteItem[];
  notes: string;
  paymentTerms: string;
  iban?: string;           // IBAN opzionale (mostrato sotto termini di pagamento)
  validityDays: number;  // giorni validità preventivo
  currency: 'EUR' | 'USD' | 'GBP' | 'CHF';
  itemCustomColumns?: { id: string; label: string }[]; // V4 custom columns for item table
  attachments?: QuoteAttachment[]; // Up to 7
  clientId?: string;     // UUID del cliente salvato in rubrica (se selezionato)
  archived?: boolean;    // true = archiviato (non compare nello storico normale)
  createdAt: string;     // ISO string
  updatedAt: string;
}
