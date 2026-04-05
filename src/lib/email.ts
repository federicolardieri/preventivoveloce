import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
};

export async function sendAccountDeletedEmail({
  to,
  hadSubscription,
}: {
  to: string;
  hadSubscription: boolean;
}) {
  const subscriptionNote = hadSubscription
    ? `<p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6;">
         Il tuo abbonamento è stato annullato e non verranno più effettuati addebiti.
         Eventuali pagamenti già fatturati non sono rimborsabili.
       </p>`
    : '';

  await resend.emails.send({
    from: `Preventivo Veloce <${FROM}>`,
    to,
    subject: 'Il tuo account è stato eliminato',
    html: `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <tr>
          <td style="background:#5c32e6;padding:32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Preventivo Veloce</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:20px;font-weight:700;">
              Account eliminato
            </h2>
            <p style="margin:0 0 16px;color:#6b7280;font-size:15px;line-height:1.6;">
              Confermiamo che il tuo account Preventivo Veloce è stato eliminato definitivamente.
              Tutti i tuoi dati (preventivi, clienti, profilo) sono stati rimossi dai nostri server.
            </p>
            ${subscriptionNote}
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
              Ci dispiace vederti andare via. Se cambi idea, puoi sempre creare un nuovo account
              con la stessa email.
            </p>
            <a href="${SITE_URL}" style="display:inline-block;background:#5c32e6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;">
              Torna al sito →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              Hai domande? Rispondi a questa email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendSubscriptionConfirmation({
  to,
  plan,
  periodEnd,
}: {
  to: string;
  plan: 'starter' | 'pro';
  periodEnd: Date;
}) {
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const formattedDate = periodEnd.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  await resend.emails.send({
    from: `Preventivo Veloce <${FROM}>`,
    to,
    subject: `Benvenuto nel piano ${planLabel} — abbonamento attivato`,
    html: `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <!-- Header -->
        <tr>
          <td style="background:#5c32e6;padding:32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Preventivo Veloce</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 32px;">
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
              Piano ${planLabel} attivato ✓
            </h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Il tuo abbonamento è stato attivato con successo. Puoi iniziare subito a creare i tuoi preventivi.
            </p>

            <!-- Plan box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Piano attivo</p>
                  <p style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:700;">${planLabel}</p>
                  <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Prossimo rinnovo</p>
                  <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">${formattedDate}</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
              Il piano si rinnova automaticamente. Puoi gestire o cancellare l'abbonamento in qualsiasi momento dalle impostazioni.
            </p>

            <a href="${SITE_URL}/dashboard" style="display:inline-block;background:#5c32e6;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;">
              Vai alla dashboard →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              Hai domande? Rispondi a questa email.<br>
              <a href="${SITE_URL}/impostazioni" style="color:#5c32e6;text-decoration:none;">Gestisci abbonamento</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
