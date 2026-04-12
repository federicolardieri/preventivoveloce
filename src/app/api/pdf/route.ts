import { NextRequest, NextResponse } from "next/server";
import { generatePDF } from "@/pdf/generatePDF";
import { Quote } from "@/types/quote";
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { checkQuota } from '@/lib/quota';
import { createClient } from '@/lib/supabase/server';
import { checkPDFRateLimit } from '@/lib/ratelimit';
import { logError } from '@/lib/logger';

async function normalizeQuote(raw: Quote): Promise<Quote> {
  const now = new Date().toISOString();
  
  // Default logo logic
  let logo = raw.sender?.logo;
  if (!logo && !raw.theme?.hideLogo) {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBuffer = await fs.readFile(logoPath);
      logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (e) {
      logError('pdf.default-logo', e);
    }
  }

  return {
    ...raw,
    id: raw.id || crypto.randomUUID(),
    number: raw.number || 'PRV-000',
    status: raw.status || 'bozza',
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
    validityDays: raw.validityDays ?? 30,
    currency: raw.currency || 'EUR',
    template: raw.template || 'classic',
    theme: {
      ...raw.theme, // ← Preserve ALL theme fields first (logoShape, logoScale, etc.)
      primaryColor: raw.theme?.primaryColor ?? '#5c32e6',
      accentColor: raw.theme?.accentColor ?? '#1d4ed8',
      textColor: raw.theme?.textColor ?? '#1e293b',
      fontFamily: raw.theme?.fontFamily ?? 'Helvetica',
      tableStyle: raw.theme?.tableStyle ?? 'striped',
      logoPosition: raw.theme?.logoPosition ?? 'left',
      logoShape: raw.theme?.logoShape ?? 'original',
      logoScale: raw.theme?.logoScale ?? 1,
      showFooterNotes: raw.theme?.showFooterNotes ?? true,
      showPaymentTerms: raw.theme?.showPaymentTerms ?? true,
    },
    sender: {
      name: raw.sender?.name || '',
      address: raw.sender?.address || '',
      city: raw.sender?.city || '',
      postalCode: raw.sender?.postalCode || '',
      country: raw.sender?.country || '',
      vatNumber: raw.sender?.vatNumber || '',
      email: raw.sender?.email || '',
      phone: raw.sender?.phone || '',
      logo: logo,
      customFields: raw.sender?.customFields || [],
    },
    client: {
      name: raw.client?.name || '',
      address: raw.client?.address || '',
      city: raw.client?.city || '',
      postalCode: raw.client?.postalCode || '',
      country: raw.client?.country || '',
      vatNumber: raw.client?.vatNumber || '',
      email: raw.client?.email || '',
      phone: raw.client?.phone || '',
      customFields: raw.client?.customFields || [],
    },
    items: (raw.items || []).map(item => ({
      ...item,
      discount: item.discount ?? 0,
      discountType: item.discountType ?? 'percentage',
      customFields: item.customFields ?? {},
    })),
    notes: raw.notes || '',
    paymentTerms: raw.paymentTerms || '',
    iban: raw.iban,
    itemCustomColumns: raw.itemCustomColumns ?? [],
    attachments: raw.attachments ?? [],
  };
}

async function applyWatermark(pdfBytes: Uint8Array, strong = false): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    if (strong) {
      // Watermark accentuato per Free/Starter in preview: 3 strisce diagonali
      const size = 46;
      const opacity = 0.25;
      const color = rgb(0.36, 0.2, 0.9); // Professional violet/blue
      const text = 'ANTEPRIMA — Passa a Pro';
      const offsets = [
        { dx: -170, dy: -180 },
        { dx: -170, dy:  100 },
        { dx: -170, dy:  380 },
      ];
      for (const { dx, dy } of offsets) {
        page.drawText(text, {
          x: width / 2 + dx,
          y: height / 2 + dy,
          size,
          font,
          color,
          opacity,
          rotate: degrees(45),
        });
      }
    } else {
      // Watermark leggero per download piano free
      page.drawText('ANTEPRIMA — Passa a Pro', {
        x: width / 2 - 160,
        y: height / 2,
        size: 42,
        font,
        color: rgb(0.36, 0.2, 0.9),
        opacity: 0.12,
        rotate: degrees(45),
      });
    }
  }

  return pdfDoc.save();
}


export async function POST(req: NextRequest) {
  let quote: Quote | null = null;
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: max 20/min per utente
    const rl = await checkPDFRateLimit(user.id);
    if (!rl.success) {
      return NextResponse.json({ error: 'Troppe richieste. Riprova tra poco.' }, { status: 429 });
    }

    const body = await req.json();
    
    // Validazione Zod
    const { quoteSchema } = await import('@/schemas/quoteSchema');
    const parsedParams = quoteSchema.safeParse(body);
    
    if (!parsedParams.success) {
      logError('pdf.validation', new Error('Quote payload validation failed'), {
        issues: parsedParams.error.issues.map((i) => ({ path: i.path, code: i.code })),
      });
      return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
    }

    // _preview: true → chiamata di anteprima (live preview), skip quota enforcement
    // _preview: false/assente → download reale, enforce quota
    const { _preview = false, _view = false, ...raw } = parsedParams.data;

    // Type casting formale per compatibilità col resto del codice
    if (!raw) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    // Validazione dimensione allegati server-side
    const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024; // 2MB per file
    const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB totale
    if (raw.attachments && Array.isArray(raw.attachments)) {
      let totalSize = 0;
      for (const att of raw.attachments) {
        if (att.data) {
          const base64Part = att.data.split(',')[1] ?? att.data;
          const size = Math.ceil(base64Part.length * 0.75);
          if (size > MAX_ATTACHMENT_SIZE) {
            return NextResponse.json({ error: `Allegato "${att.name}" troppo grande (max 2MB)` }, { status: 400 });
          }
          totalSize += size;
        }
      }
      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json({ error: 'Allegati troppo pesanti (max 10MB totale)' }, { status: 400 });
      }
    }

    // ── Piano utente (solo per decidere il watermark, mai per bloccare) ─────
    // I crediti vengono consumati dal trigger DB su INSERT in quotes.
    // Il PDF è sempre generabile per utenti autenticati: il blocco avviene
    // prima del salvataggio (in QuoteEditor/persistToSupabase), non qui.
    let quota: Awaited<ReturnType<typeof checkQuota>> | null = null;
    try {
      quota = await checkQuota(raw.id ?? '');
    } catch (e) {
      logError('pdf.check-quota', e);
    }

    quote = await normalizeQuote(raw as Quote);

    if (!quote) {
      throw new Error("Failed to normalize quote");
    }

    const stream = await generatePDF(quote);

    // Convert Node.js ReadableStream to Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const baseBuffer = Buffer.concat(chunks);

    // Watermark logic:
    // - Preview: Show strong watermark for anyone not on Pro (Free or Starter)
    // - Download: Show light watermark for Free only, Starter and Pro are clean
    const currentPlan = quota?.plan ?? 'free';
    const isPro = currentPlan === 'pro';

    // Watermark logic:
    // 1. Editor Preview (_preview=true, _view=false): Watermark for anyone not on Pro
    // 2. Detail Preview (_preview=true, _view=true): Watermark ONLY for Free users
    // 3. Download (_preview=false): Watermark ONLY for Free users
    
    let needsWatermark = false;
    let useStrongWatermark = false;

    if (_preview) {
      if (_view) {
        // Schermata "Visualizza" (Detail Viewer) - Pulita per tutti
        needsWatermark = false;
        useStrongWatermark = false;
      } else {
        // Schermata "Nuovo/Modifica" (Editor) - Watermark per Free e Starter
        needsWatermark = !isPro;
        useStrongWatermark = !isPro;
      }
    } else {
      // Download reale - Pulito per tutti
      needsWatermark = false;
      useStrongWatermark = false;
    }

    let finalPdfBytes: Uint8Array = needsWatermark
      ? await applyWatermark(baseBuffer, useStrongWatermark)
      : baseBuffer;

    // Merge attachments if they exist
    if (quote.attachments && quote.attachments.length > 0) {
      const pdfDoc = await PDFDocument.load(finalPdfBytes);
      
      for (const att of quote.attachments) {
        try {
          if (!att.data) continue;
          const base64Parts = att.data.split(',');
          if (base64Parts.length < 2) continue;
          
          const base64Data = base64Parts[1];
          const fileBytes = Buffer.from(base64Data, 'base64');
          
          if (att.type === 'application/pdf') {
            const externalPdf = await PDFDocument.load(fileBytes);
            const copiedPages = await pdfDoc.copyPages(externalPdf, externalPdf.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));
          } else if (att.type === 'image/jpeg' || att.type === 'image/png') {
            let image;
            if (att.type === 'image/jpeg') image = await pdfDoc.embedJpg(fileBytes);
            else if (att.type === 'image/png') image = await pdfDoc.embedPng(fileBytes);
            
            if (image) {
              const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 layout
              const { width, height } = page.getSize();
              const margin = 50;
              const imgDims = image.scaleToFit(width - (margin * 2), height - (margin * 2));
              
              page.drawImage(image, {
                x: width / 2 - imgDims.width / 2,
                y: height / 2 - imgDims.height / 2,
                width: imgDims.width,
                height: imgDims.height,
              });
            }
          }
        } catch (attError) {
          logError('pdf.attachment-merge', attError, { attachment_type: att.type });
          // Continue with next attachment on error
        }
      }
      
      finalPdfBytes = await pdfDoc.save();
    }

    return new NextResponse(Buffer.from(finalPdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="preventivo-${quote.number}.pdf"`
      }
    });

  } catch (error) {
    logError('pdf', error);
    return NextResponse.json({
      error: "Si è verificato un errore durante la generazione del documento."
    }, { status: 500 });
  }
}
