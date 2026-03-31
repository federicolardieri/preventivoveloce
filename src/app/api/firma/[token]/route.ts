import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generatePDF } from '@/pdf/generatePDF';
import { Quote } from '@/types/quote';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'preventivi@preventivoveloce.it';

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
    attachments: [],
  };
}

async function generatePDFBuffer(quote: Quote): Promise<Buffer> {
  const normalized = await normalizeQuoteForPDF(quote);
  const stream = await generatePDF(normalized);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function stampAccepted(pdfBuffer: Buffer, clientName: string, acceptedAt: Date): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();

  const dateStr = acceptedAt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = acceptedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  // Timbro verde "ACCETTATO" in basso a destra
  const stampX = width - 200;
  const stampY = 60;

  lastPage.drawRectangle({
    x: stampX - 10,
    y: stampY - 10,
    width: 170,
    height: 70,
    color: rgb(0.94, 1, 0.96),
    borderColor: rgb(0.13, 0.77, 0.37),
    borderWidth: 2,
    opacity: 0.92,
  });

  lastPage.drawText('ACCETTATO', {
    x: stampX,
    y: stampY + 40,
    size: 14,
    font,
    color: rgb(0.05, 0.6, 0.25),
  });

  lastPage.drawText(clientName.substring(0, 24), {
    x: stampX,
    y: stampY + 22,
    size: 9,
    font,
    color: rgb(0.1, 0.4, 0.2),
  });

  lastPage.drawText(`${dateStr} ${timeStr}`, {
    x: stampX,
    y: stampY + 8,
    size: 8,
    font,
    color: rgb(0.3, 0.5, 0.35),
  });

  return Buffer.from(await pdfDoc.save());
}

// ── GET /api/firma/[token] → restituisce i dati del preventivo (per la pagina pubblica)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: tokenRow, error } = await admin
    .from('quote_tokens')
    .select('*, quotes(*)')
    .eq('token', token)
    .single();

  if (error || !tokenRow) {
    return NextResponse.json({ error: 'Link non valido' }, { status: 404 });
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link scaduto' }, { status: 410 });
  }

  const quoteRow = tokenRow.quotes as Record<string, unknown>;

  return NextResponse.json({
    quoteNumber: quoteRow.number,
    clientName: (quoteRow.client as Record<string, string>)?.name || '',
    senderName: (quoteRow.sender as Record<string, string>)?.name || '',
    validityDays: quoteRow.validity_days,
    alreadyAccepted: !!tokenRow.accepted_at,
    acceptedAt: tokenRow.accepted_at,
  });
}

// ── POST /api/firma/[token] → registra accettazione e invia email conferma
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: tokenRow, error } = await admin
    .from('quote_tokens')
    .select('*, quotes(*)')
    .eq('token', token)
    .single();

  if (error || !tokenRow) {
    return NextResponse.json({ error: 'Link non valido' }, { status: 404 });
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link scaduto' }, { status: 410 });
  }

  if (tokenRow.accepted_at) {
    return NextResponse.json({ error: 'Preventivo già accettato' }, { status: 409 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  const acceptedAt = new Date();

  // Registra accettazione
  await admin
    .from('quote_tokens')
    .update({ accepted_at: acceptedAt.toISOString(), accepted_ip: ip })
    .eq('token', token);

  // Aggiorna status preventivo
  await admin
    .from('quotes')
    .update({ status: 'accettato', updated_at: acceptedAt.toISOString() })
    .eq('id', tokenRow.quote_id);

  // Carica dati quote e genera PDF timbrato
  const quoteRow = tokenRow.quotes as Record<string, unknown>;
  const quote: Quote = {
    id: String(quoteRow.id),
    number: String(quoteRow.number),
    status: String(quoteRow.status) as Quote['status'],
    template: quoteRow.template as Quote['template'],
    theme: quoteRow.theme as Quote['theme'],
    sender: quoteRow.sender as Quote['sender'],
    client: quoteRow.client as Quote['client'],
    items: quoteRow.items as Quote['items'],
    notes: String(quoteRow.notes ?? ''),
    paymentTerms: String(quoteRow.payment_terms ?? ''),
    iban: quoteRow.iban ? String(quoteRow.iban) : undefined,
    validityDays: Number(quoteRow.validity_days ?? 30),
    currency: (quoteRow.currency as Quote['currency']) ?? 'EUR',
    itemCustomColumns: (quoteRow.item_custom_columns as Quote['itemCustomColumns']) ?? [],
    attachments: [],
    createdAt: String(quoteRow.created_at),
    updatedAt: String(quoteRow.updated_at),
  };
  const clientName = quote.client?.name || 'Cliente';
  const clientEmail = quote.client?.email || '';
  const senderName = quote.sender?.name || 'Mittente';
  const senderEmail = quote.sender?.email || '';
  const quoteNumber = quote.number;

  let stampedPdfBuffer: Buffer | null = null;
  try {
    const basePdf = await generatePDFBuffer(quote);
    console.log('[firma/accept] base PDF size:', basePdf.length);
    stampedPdfBuffer = await stampAccepted(basePdf, clientName, acceptedAt);
    console.log('[firma/accept] stamped PDF size:', stampedPdfBuffer.length);
  } catch (err) {
    console.error('[firma/accept] PDF stamp error:', err);
  }

  const fileName = `Preventivo-${quoteNumber}-ACCETTATO.pdf`;
  const attachments = stampedPdfBuffer
    ? [{ filename: fileName, content: stampedPdfBuffer }]
    : [];

  const dateStr = acceptedAt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Email conferma al cliente
  if (clientEmail) {
    await resend.emails.send({
      from: `Preventivo Veloce <${FROM_EMAIL}>`,
      to: clientEmail,
      subject: `Conferma accettazione preventivo ${quoteNumber}`,
      html: buildConfirmClientHtml({ clientName, senderName, quoteNumber, dateStr }),
      attachments,
    });
  }

  // Email notifica al mittente
  if (senderEmail) {
    await resend.emails.send({
      from: `Preventivo Veloce <${FROM_EMAIL}>`,
      to: senderEmail,
      subject: `✓ ${clientName} ha accettato il preventivo ${quoteNumber}`,
      html: buildNotifySenderHtml({ clientName, senderName, quoteNumber, dateStr, ip }),
      attachments,
    });
  }

  return NextResponse.json({ ok: true });
}

function escHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildConfirmClientHtml({ clientName, senderName, quoteNumber, dateStr }: {
  clientName: string; senderName: string; quoteNumber: string; dateStr: string;
}) {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8" /><title>Conferma accettazione</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#10b981);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:32px;">✓</p>
            <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;">Preventivo Accettato</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#334155;">Gentile <strong>${escHtml(clientName)}</strong>,</p>
            <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
              Hai accettato il preventivo <strong style="color:#1e293b;">${escHtml(quoteNumber)}</strong>
              di <strong>${escHtml(senderName)}</strong> in data <strong>${dateStr}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
              Trovi il documento con il timbro di accettazione in allegato a questa email.
              ${escHtml(senderName)} riceverà una notifica e ti contatterà per i prossimi passi.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              Inviato tramite <strong>Preventivo Veloce</strong>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildNotifySenderHtml({ clientName, senderName, quoteNumber, dateStr, ip }: {
  clientName: string; senderName: string; quoteNumber: string; dateStr: string; ip: string;
}) {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8" /><title>Preventivo accettato</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#5c32e6,#7c53f0);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:32px;">&#127881;</p>
            <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;">Preventivo Accettato!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#334155;">Ciao <strong>${escHtml(senderName)}</strong>,</p>
            <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
              <strong>${escHtml(clientName)}</strong> ha accettato il preventivo
              <strong style="color:#1e293b;">${escHtml(quoteNumber)}</strong> in data <strong>${dateStr}</strong>.
            </p>
            <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;border:1px solid #e2e8f0;margin-bottom:24px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                IP registrato: <code>${escHtml(ip)}</code><br />
                Data: ${dateStr}
              </p>
            </div>
            <p style="margin:0;font-size:15px;color:#475569;line-height:1.6;">
              Il preventivo è stato aggiornato a <strong>"Accettato"</strong> nel tuo account.
              Trovi il documento timbrato in allegato.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              Inviato tramite <strong>Preventivo Veloce</strong>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
