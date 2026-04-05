import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generatePDF } from '@/pdf/generatePDF';
import { Quote } from '@/types/quote';
import { Resend } from 'resend';
import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { checkEmailRateLimit } from '@/lib/ratelimit';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'preventivi@preventivoveloce.it';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

async function normalizeQuoteForPDF(raw: Quote): Promise<Quote> {
  const now = new Date().toISOString();
  let logo = raw.sender?.logo;
  if (!logo) {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBuffer = await fs.readFile(logoPath);
      logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch { /* ignora */ }
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
      ...raw.theme,
      primaryColor: raw.theme?.primaryColor ?? '#5c32e6',
      accentColor: raw.theme?.accentColor ?? '#1d4ed8',
      textColor: raw.theme?.textColor ?? '#1e293b',
      fontFamily: raw.theme?.fontFamily ?? 'Helvetica',
      tableStyle: raw.theme?.tableStyle ?? 'striped',
      logoPosition: raw.theme?.logoPosition ?? 'left',
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
      logo,
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
    itemCustomColumns: raw.itemCustomColumns ?? [],
    attachments: raw.attachments ?? [],
  };
}

async function generatePDFBuffer(quote: Quote): Promise<Buffer> {
  const normalized = await normalizeQuoteForPDF(quote);
  const stream = await generatePDF(normalized);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const baseBuffer = Buffer.concat(chunks);

  // Merge attachments if they exist
  if (normalized.attachments && normalized.attachments.length > 0) {
    try {
      const pdfDoc = await PDFDocument.load(baseBuffer);
      
      for (const att of normalized.attachments) {
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
          console.error(`[send-quote] Failed to merge attachment ${att.name}`, attError);
        }
      }
      
      const mergedPdfBytes = await pdfDoc.save();
      return Buffer.from(mergedPdfBytes);
    } catch (mergeError) {
      console.error('[send-quote] PDF merge failed, returning base PDF', mergeError);
      return baseBuffer;
    }
  }

  return baseBuffer;
}

export async function POST(req: NextRequest) {
  try {
    const sendQuoteSchema = z.object({
      quoteId: z.string().uuid('quoteId non valido'),
      customMessage: z.string().max(1000).optional().default(''),
    });

    const parsed = sendQuoteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Input non valido' }, { status: 400 });
    }
    const { quoteId, customMessage } = parsed.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Rate limit: max 10 email/ora per utente
    const rl = await checkEmailRateLimit(user.id);
    if (!rl.success) {
      return NextResponse.json({ error: 'Troppe email inviate. Riprova più tardi.' }, { status: 429 });
    }

    // Carica il preventivo
    const { data: quoteRow, error: quoteErr } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single();

    if (quoteErr || !quoteRow) {
      return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
    }

    // Ricostruisce l'oggetto Quote dalle colonne della tabella
    const quote: Quote = {
      id: quoteRow.id,
      number: quoteRow.number,
      status: quoteRow.status,
      template: quoteRow.template,
      theme: quoteRow.theme,
      sender: quoteRow.sender,
      client: quoteRow.client,
      items: quoteRow.items,
      notes: quoteRow.notes ?? '',
      paymentTerms: quoteRow.payment_terms ?? '',
      iban: quoteRow.iban ?? undefined,
      validityDays: quoteRow.validity_days ?? 30,
      currency: quoteRow.currency ?? 'EUR',
      itemCustomColumns: quoteRow.item_custom_columns ?? [],
      attachments: quoteRow.attachments ?? [],
      createdAt: quoteRow.created_at,
      updatedAt: quoteRow.updated_at,
    };

    const clientEmail = quote.client?.email;
    const clientName = quote.client?.name || 'Cliente';
    const senderName = quote.sender?.name || 'Mittente';

    if (!clientEmail) {
      return NextResponse.json({ error: 'Email cliente mancante nel preventivo' }, { status: 400 });
    }

    // Genera token univoco (32 byte hex = 64 char)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + quote.validityDays * 24 * 60 * 60 * 1000);

    const admin = createAdminClient();
    const { error: tokenErr } = await admin
      .from('quote_tokens')
      .insert({ quote_id: quoteId, token, expires_at: expiresAt.toISOString() });

    if (tokenErr) {
      console.error('[send-quote] token insert error:', tokenErr);
      return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }

    // Genera PDF
    const pdfBuffer = await generatePDFBuffer(quote);
    const acceptUrl = `${SITE_URL}/firma/${token}`;
    const fileName = `Preventivo-${quoteRow.number}.pdf`;

    // Invia email al cliente
    const { error: emailErr } = await resend.emails.send({
      from: `${senderName} via Preventivo Veloce <${FROM_EMAIL}>`,
      to: clientEmail,
      subject: `Preventivo ${quoteRow.number} da ${senderName}`,
      html: buildClientEmailHtml({ senderName, clientName, quoteNumber: quoteRow.number, acceptUrl, validityDays: quote.validityDays, customMessage: customMessage.trim() }),
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
        },
      ],
    });

    if (emailErr) {
      console.error('[send-quote] resend error:', emailErr);
      return NextResponse.json({ error: 'Errore invio email' }, { status: 500 });
    }

    // Aggiorna status a "inviato"
    await supabase
      .from('quotes')
      .update({ status: 'inviato', updated_at: new Date().toISOString() })
      .eq('id', quoteId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[send-quote] exception:', err);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

function buildClientEmailHtml({
  senderName,
  clientName,
  quoteNumber,
  acceptUrl,
  validityDays,
  customMessage,
}: {
  senderName: string;
  clientName: string;
  quoteNumber: string;
  acceptUrl: string;
  validityDays: number;
  customMessage: string;
}) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preventivo ${quoteNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#5c32e6,#7c53f0);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:1px;text-transform:uppercase;">Hai ricevuto un</p>
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Preventivo</h1>
              <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);font-weight:600;">da ${escHtml(senderName)}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#334155;">Gentile <strong>${escHtml(clientName)}</strong>,</p>
              <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
                ${escHtml(senderName)} ti ha inviato il preventivo <strong style="color:#1e293b;">${escHtml(quoteNumber)}</strong>.
                Trovi il documento in allegato a questa email.
              </p>
              ${customMessage ? `
              <div style="background:#f8fafc;border-left:4px solid #5c32e6;border-radius:0 10px 10px 0;padding:16px 20px;margin:0 0 20px;">
                <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Messaggio da ${escHtml(senderName)}</p>
                <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;white-space:pre-line;">${escHtml(customMessage)}</p>
              </div>
              ` : ''}
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
                Il preventivo è valido per <strong>${validityDays} giorni</strong>. Se sei d'accordo, puoi accettarlo direttamente online cliccando il pulsante qui sotto.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${acceptUrl}"
                       style="display:inline-block;background:#5c32e6;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(92,50,230,0.35);">
                      ✓ Accetta il preventivo
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;border:1px solid #e2e8f0;">
                <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
                  Se il pulsante non funziona, copia e incolla questo link nel browser:<br />
                  <a href="${acceptUrl}" style="color:#5c32e6;word-break:break-all;">${acceptUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Questa email è stata inviata tramite <strong>Preventivo Veloce</strong>.<br />
                Se non ti aspettavi questa email, puoi ignorarla.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
