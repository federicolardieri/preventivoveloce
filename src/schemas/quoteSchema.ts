import { z } from 'zod';

// Valida un data URL di immagine (PNG/JPEG/GIF/WEBP) con limite di dimensione.
// Il client ammette fino a 6MB di file: base64 ≈ 4/3 ⇒ limite stringa ~8.5MB.
const MAX_LOGO_DATA_URL_LEN = 8_500_000;
const LOGO_DATA_URL_PREFIX = /^data:image\/(png|jpe?g|gif|webp);base64,/i;

const logoDataUrlSchema = z
  .string()
  .max(MAX_LOGO_DATA_URL_LEN, 'Logo troppo grande')
  .refine(
    (val) => val === '' || LOGO_DATA_URL_PREFIX.test(val),
    { message: 'Formato logo non valido (PNG, JPG, GIF o WEBP)' },
  )
  .optional();

export const quoteThemeSchema = z.object({
  primaryColor: z.string(),
  accentColor: z.string(),
  textColor: z.string(),
  fontFamily: z.enum(['Helvetica', 'Times-Roman', 'Courier']),
  tableStyle: z.enum(['striped', 'bordered', 'minimal']),
  logoPosition: z.enum(['left', 'center', 'right']),
  logoShape: z.enum(['original', 'circle', 'square']).optional(),
  logoScale: z.number().optional(),
  logoOffsetX: z.number().optional(),
  logoOffsetY: z.number().optional(),
  logoPadding: z.number().optional(),
  showFooterNotes: z.boolean(),
  showPaymentTerms: z.boolean(),
  hideLogo: z.boolean().optional(),
});

export const contactInfoSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string(),
  vatNumber: z.string(),
  email: z.string(),
  phone: z.string(),
  logo: logoDataUrlSchema,
  logoOriginal: logoDataUrlSchema,
  customFields: z.array(z.object({ id: z.string(), label: z.string(), value: z.string() })).optional(),
});

export const quoteItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  discount: z.number(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  vatRate: z.number(),
  customFields: z.record(z.string(), z.string()).optional(),
});

export const quoteAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.string(),
  type: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
});

export const quoteSchema = z.object({
  id: z.string(),
  number: z.string(),
  status: z.enum(['bozza', 'da_inviare', 'inviato', 'accettato', 'rifiutato', 'scaduto']),
  template: z.enum(['classic', 'modern', 'minimal', 'bold', 'corporate', 'creative', 'cover-page', 'executive']),
  theme: quoteThemeSchema,
  sender: contactInfoSchema,
  client: contactInfoSchema.omit({ logo: true, logoOriginal: true }),
  items: z.array(quoteItemSchema),
  notes: z.string(),
  paymentTerms: z.string(),
  iban: z.string().optional(),
  validityDays: z.number(),
  currency: z.enum(['EUR', 'USD', 'GBP', 'CHF']),
  itemCustomColumns: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  attachments: z.array(quoteAttachmentSchema).optional(),
  clientId: z.string().optional(),
  archived: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Endpoint specific flags
  _preview: z.boolean().optional(),
  _view: z.boolean().optional(),
});
