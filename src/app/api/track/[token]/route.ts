import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { logError } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'preventivi@ilpreventivoveloce.it';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Transparent 1x1 GIF pixel
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Always return the pixel immediately — fire and forget the tracking logic
  const pixelResponse = new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });

  // Fire-and-forget: record the open event
  recordOpen(token).catch((err) => logError('track-open', err));

  return pixelResponse;
}

async function recordOpen(token: string) {
  // Validate token format
  if (!/^[0-9a-f]{64}$/.test(token)) return;

  const admin = createAdminClient();

  // Fetch token data with quote info
  const { data: tokenRow } = await admin
    .from('quote_tokens')
    .select('id, quote_id, first_opened_at, open_count, accepted_at')
    .eq('token', token)
    .single();

  if (!tokenRow) return;

  const now = new Date().toISOString();
  const isFirstOpen = !tokenRow.first_opened_at;

  // Always increment open_count
  await admin
    .from('quote_tokens')
    .update({
      open_count: (tokenRow.open_count || 0) + 1,
      ...(isFirstOpen ? { first_opened_at: now } : {}),
    })
    .eq('id', tokenRow.id);

  // Only send notification on FIRST open (not already accepted)
  if (!isFirstOpen || tokenRow.accepted_at) return;

  // Fetch the quote + user data for the notification
  const { data: quoteRow } = await admin
    .from('quotes')
    .select('id, number, user_id, client, sender')
    .eq('id', tokenRow.quote_id)
    .single();

  if (!quoteRow) return;

  const clientName = (quoteRow.client as Record<string, string>)?.name || 'Il cliente';
  const senderEmail = (quoteRow.sender as Record<string, string>)?.email;
  const quoteNumber = quoteRow.number;

  // 1. Create in-app notification
  await admin.from('notifications').insert({
    user_id: quoteRow.user_id,
    type: 'quote_opened',
    title: `${clientName} ha aperto il preventivo`,
    message: `${clientName} ha aperto il preventivo ${quoteNumber}. È il momento giusto per un follow-up!`,
    quote_id: quoteRow.id,
  });

  // 2. Send email notification to sender
  if (senderEmail) {
    try {
      await resend.emails.send({
        from: `Preventivo Veloce <${FROM_EMAIL}>`,
        to: senderEmail,
        subject: `👀 ${clientName} ha aperto ${quoteNumber}`,
        html: buildOpenNotificationEmail({
          clientName,
          quoteNumber,
          dashboardUrl: `${SITE_URL}/preventivi/${quoteRow.id}`,
        }),
      });
    } catch (err) {
      logError('track-open.email', err);
    }
  }
}

function buildOpenNotificationEmail({
  clientName,
  quoteNumber,
  dashboardUrl,
}: {
  clientName: string;
  quoteNumber: string;
  dashboardUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preventivo aperto</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:36px;">👀</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.3px;">Preventivo aperto!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.6;">
                <strong style="color:#1e293b;">${escHtml(clientName)}</strong> ha appena aperto il preventivo
                <strong style="color:#1e293b;">${escHtml(quoteNumber)}</strong>.
              </p>

              <div style="background:#eff6ff;border-radius:12px;padding:16px 20px;margin:0 0 20px;border:1px solid #dbeafe;">
                <p style="margin:0 0 4px;font-size:11px;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;font-weight:700;">💡 Suggerimento</p>
                <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.5;">
                  I preventivi seguiti entro 5 minuti dall'apertura hanno il <strong>40% in più di probabilità</strong> di essere accettati.
                </p>
              </div>

              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${dashboardUrl}"
                       style="display:inline-block;background:#5c32e6;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(92,50,230,0.3);">
                      Vai al preventivo →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.5;">
                Notifica automatica di <strong>Preventivo Veloce</strong>.<br />
                Ricevi questa email perché hai inviato un preventivo tramite la piattaforma.
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
