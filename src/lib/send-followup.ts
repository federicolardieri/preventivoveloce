import { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';
import { logError } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'preventivi@ilpreventivoveloce.it';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function executeSendFollowUp(
  followupId: string,
  adminClient: SupabaseClient
): Promise<{ ok: boolean; error?: string }> {
  // 1. Carica follow-up (solo se pending)
  const { data: followup, error: fuErr } = await adminClient
    .from('quote_followups')
    .select('*')
    .eq('id', followupId)
    .eq('status', 'pending')
    .single();

  if (fuErr || !followup) {
    return { ok: false, error: 'Follow-up non trovato o già processato' };
  }

  // 2. Carica preventivo
  const { data: quoteRow, error: qErr } = await adminClient
    .from('quotes')
    .select('*')
    .eq('id', followup.quote_id)
    .single();

  if (qErr || !quoteRow) {
    await adminClient
      .from('quote_followups')
      .update({ status: 'failed' })
      .eq('id', followupId);
    return { ok: false, error: 'Preventivo non trovato' };
  }

  const clientEmail: string | undefined = quoteRow.client?.email;
  const clientName: string = quoteRow.client?.name || 'Cliente';
  const senderName: string = quoteRow.sender?.name || 'Mittente';
  const senderEmail: string | undefined = quoteRow.sender?.email;

  if (!clientEmail) {
    await adminClient
      .from('quote_followups')
      .update({ status: 'failed' })
      .eq('id', followupId);
    return { ok: false, error: 'Email cliente mancante nel preventivo' };
  }

  // 3. Recupera token attivo o ne crea uno nuovo
  const now = new Date();
  let token: string;

  const { data: existingToken } = await adminClient
    .from('quote_tokens')
    .select('token')
    .eq('quote_id', followup.quote_id)
    .gt('expires_at', now.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingToken) {
    token = existingToken.token;
  } else {
    token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      now.getTime() + (quoteRow.validity_days ?? 30) * 24 * 60 * 60 * 1000
    );
    const { error: tokenInsertErr } = await adminClient.from('quote_tokens').insert({
      quote_id: followup.quote_id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    if (tokenInsertErr) {
      logError('send-followup.token-insert', tokenInsertErr);
      await adminClient
        .from('quote_followups')
        .update({ status: 'failed' })
        .eq('id', followupId);
      return { ok: false, error: 'Errore creazione token' };
    }
  }

  const acceptUrl = `${SITE_URL}/firma/${token}`;

  // 4. Invia email via Resend al cliente
  const { error: emailErr } = await resend.emails.send({
    from: `${senderName} via Preventivo Veloce <${FROM_EMAIL}>`,
    to: clientEmail,
    subject: `Follow-up preventivo ${quoteRow.number} da ${senderName}`,
    html: buildFollowUpEmailHtml({
      senderName,
      clientName,
      quoteNumber: quoteRow.number,
      acceptUrl,
      message: followup.custom_message,
    }),
  });

  if (emailErr) {
    logError('send-followup.resend', emailErr);
    await adminClient
      .from('quote_followups')
      .update({ status: 'failed' })
      .eq('id', followupId);
    return { ok: false, error: 'Errore invio email' };
  }

  // 5a. Aggiorna stato preventivo → follow_up_inviato (solo se era 'inviato')
  const { error: quoteUpdateErr } = await adminClient
    .from('quotes')
    .update({ status: 'follow_up_inviato', updated_at: new Date().toISOString() })
    .eq('id', followup.quote_id)
    .eq('status', 'inviato');

  if (quoteUpdateErr) {
    logError('send-followup.quote-status-update', quoteUpdateErr, { followupId });
  }

  // 5b. Notifica in-app
  const { error: notifErr } = await adminClient.from('notifications').insert({
    user_id: followup.user_id,
    type: 'followup_sent',
    title: 'Follow-up inviato',
    message: `Il follow-up per il preventivo ${quoteRow.number} è stato inviato a ${clientName}.`,
    quote_id: followup.quote_id,
  });

  if (notifErr) {
    logError('send-followup.notification-insert', notifErr);
  }

  // 5c. Email al mittente (best-effort)
  if (senderEmail) {
    const { error: ownerEmailErr } = await resend.emails.send({
      from: `Preventivo Veloce <${FROM_EMAIL}>`,
      to: senderEmail,
      subject: `Follow-up inviato — Preventivo ${quoteRow.number}`,
      html: buildFollowUpOwnerEmailHtml({
        senderName,
        clientName,
        clientEmail,
        quoteNumber: quoteRow.number,
        quotesUrl: `${SITE_URL}/preventivi`,
      }),
    });

    if (ownerEmailErr) {
      logError('send-followup.owner-email', ownerEmailErr);
    }
  }

  // 6. Aggiorna status follow-up
  const { error: updateErr } = await adminClient
    .from('quote_followups')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', followupId);

  if (updateErr) {
    logError('send-followup.status-update', updateErr, { followupId });
  }

  return { ok: true };
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFollowUpEmailHtml({
  senderName,
  clientName,
  quoteNumber,
  acceptUrl,
  message,
}: {
  senderName: string;
  clientName: string;
  quoteNumber: string;
  acceptUrl: string;
  message: string;
}): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#5c32e6,#7c53f0);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:1px;text-transform:uppercase;">Follow-up preventivo</p>
            <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">${esc(quoteNumber)}</h1>
            <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);font-weight:600;">da ${esc(senderName)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#334155;">Gentile <strong>${esc(clientName)}</strong>,</p>
            ${message.trim() ? `
            <div style="background:#f8fafc;border-left:4px solid #5c32e6;border-radius:0 10px 10px 0;padding:16px 20px;margin:0 0 24px;">
              <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;white-space:pre-line;">${esc(message)}</p>
            </div>` : ''}
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding:8px 0 32px;">
                  <a href="${acceptUrl}" style="display:inline-block;background:#5c32e6;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(92,50,230,0.35);">
                    Visualizza preventivo →
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
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
              Questa email è stata inviata tramite <strong>Preventivo Veloce</strong>.<br />
              Se non ti aspettavi questa email, puoi ignorarla.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildFollowUpOwnerEmailHtml({
  senderName,
  clientName,
  clientEmail,
  quoteNumber,
  quotesUrl,
}: {
  senderName: string;
  clientName: string;
  clientEmail: string;
  quoteNumber: string;
  quotesUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#5c32e6,#7c53f0);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:28px;">📨</p>
            <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;">Follow-up Inviato</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#334155;">Ciao <strong>${esc(senderName)}</strong>,</p>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
              Il follow-up per il preventivo <strong style="color:#1e293b;">${esc(quoteNumber)}</strong>
              è stato inviato a <strong>${esc(clientName)}</strong>
              (<a href="mailto:${esc(clientEmail)}" style="color:#5c32e6;">${esc(clientEmail)}</a>).
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
              Il preventivo è stato aggiornato a <strong>"Follow-up inviato"</strong> nel tuo account.
            </p>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding:8px 0 32px;">
                  <a href="${quotesUrl}" style="display:inline-block;background:#5c32e6;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(92,50,230,0.35);">
                    Vai allo storico →
                  </a>
                </td>
              </tr>
            </table>
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
