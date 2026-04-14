# Follow-up Inviato: Stato + Notifiche — Piano di Implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere lo stato `follow_up_inviato` ai preventivi e notificare il mittente (in-app + email) quando un follow-up viene inviato con successo al cliente.

**Architecture:** Il punto di ingresso unico è `executeSendFollowUp` in `src/lib/send-followup.ts`. Dopo l'invio email al cliente, vengono eseguiti tre step best-effort in sequenza: aggiornamento stato preventivo (condizionale su `status = 'inviato'`), inserimento notifica in-app, invio email al mittente. Il DB richiede una migration per allargare i `CHECK` constraint.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (PostgreSQL via MCP), Resend, Vitest, Zod.

---

## File coinvolti

| File | Azione |
|------|--------|
| `supabase/migrations/20260414_000_followup_status.sql` | Crea |
| `src/types/quote.ts` | Modifica — aggiunge `'follow_up_inviato'` a `QuoteStatus` |
| `src/schemas/quoteSchema.ts` | Modifica — aggiunge `'follow_up_inviato'` all'enum `status` |
| `src/lib/send-followup.test.ts` | Modifica — aggiunge test per step 5a/5b/5c |
| `src/lib/send-followup.ts` | Modifica — aggiunge step 5a/5b/5c |
| `src/components/quotes-list/QuoteStatusBadge.tsx` | Modifica — aggiunge badge `follow_up_inviato` |

---

## Task 1: Migration SQL

**Files:**
- Crea: `supabase/migrations/20260414_000_followup_status.sql`

- [ ] **Step 1: Crea il file di migration**

```sql
-- ============================================================
-- Aggiunge stato follow_up_inviato ai preventivi
-- e tipo followup_sent alle notifiche
-- ============================================================

-- Aggiunge CHECK constraint su quotes.status
-- (la colonna era TEXT NOT NULL senza constraint — questo lo aggiunge)
ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check
    CHECK (status IN (
      'bozza', 'da_inviare', 'inviato', 'follow_up_inviato',
      'accettato', 'rifiutato', 'scaduto'
    ));

-- Allarga il CHECK inline su notifications.type
-- Il constraint inline ha nome auto-generato notifications_type_check in PostgreSQL
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'credits_low', 'credits_empty', 'quote_sent', 'quote_accepted', 'followup_sent'
    ));
```

- [ ] **Step 2: Applica la migration via MCP Supabase**

Usa il tool `mcp__supabase__apply_migration` con:
- `name`: `followup_status`
- `query`: il contenuto SQL sopra

- [ ] **Step 3: Verifica che la migration risulti applicata**

Usa `mcp__supabase__list_migrations` e controlla che `20260414_000_followup_status` compaia nella lista.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260414_000_followup_status.sql
git commit -m "feat: add follow_up_inviato status and followup_sent notification type"
```

---

## Task 2: Tipi TypeScript e Schema Zod

**Files:**
- Modifica: `src/types/quote.ts`
- Modifica: `src/schemas/quoteSchema.ts`

- [ ] **Step 1: Aggiorna `QuoteStatus` in `src/types/quote.ts`**

Riga 2, cambia da:
```ts
export type QuoteStatus = 'bozza' | 'da_inviare' | 'inviato' | 'accettato' | 'rifiutato' | 'scaduto';
```
a:
```ts
export type QuoteStatus = 'bozza' | 'da_inviare' | 'inviato' | 'follow_up_inviato' | 'accettato' | 'rifiutato' | 'scaduto';
```

- [ ] **Step 2: Aggiorna l'enum `status` in `src/schemas/quoteSchema.ts`**

Riga 69, cambia da:
```ts
  status: z.enum(['bozza', 'da_inviare', 'inviato', 'accettato', 'rifiutato', 'scaduto']),
```
a:
```ts
  status: z.enum(['bozza', 'da_inviare', 'inviato', 'follow_up_inviato', 'accettato', 'rifiutato', 'scaduto']),
```

- [ ] **Step 3: Verifica typecheck**

```bash
npm run typecheck
```
Expected: nessun errore.

- [ ] **Step 4: Commit**

```bash
git add src/types/quote.ts src/schemas/quoteSchema.ts
git commit -m "feat: add follow_up_inviato to QuoteStatus type and Zod schema"
```

---

## Task 3: Badge UI per il nuovo stato

**Files:**
- Modifica: `src/components/quotes-list/QuoteStatusBadge.tsx`

- [ ] **Step 1: Aggiungi la voce nel `STATUS_CONFIG`**

In `src/components/quotes-list/QuoteStatusBadge.tsx`, il `STATUS_CONFIG` è tipizzato come `Record<QuoteStatus, ...>`. Ora che `QuoteStatus` include `follow_up_inviato`, TypeScript segnala un errore di tipo finché non si aggiunge la voce.

Aggiungi la riga dopo `inviato`:
```ts
const STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string }> = {
  bozza:              { label: "Bozza",             className: "bg-amber-100 text-amber-800 border-amber-200" },
  da_inviare:         { label: "Da Inviare",         className: "bg-orange-100 text-orange-700 border-orange-200" },
  inviato:            { label: "Inviato",            className: "bg-blue-100 text-blue-800 border-blue-200" },
  follow_up_inviato:  { label: "Follow-up inviato",  className: "bg-violet-100 text-violet-800 border-violet-200" },
  accettato:          { label: "Accettato",          className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rifiutato:          { label: "Rifiutato",          className: "bg-red-100 text-red-800 border-red-200" },
  scaduto:            { label: "Scaduto",            className: "bg-slate-100 text-slate-600 border-slate-200" },
};
```

- [ ] **Step 2: Verifica typecheck**

```bash
npm run typecheck
```
Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add src/components/quotes-list/QuoteStatusBadge.tsx
git commit -m "feat: add follow_up_inviato badge (violet) to QuoteStatusBadge"
```

---

## Task 4: Test per i nuovi step di `executeSendFollowUp`

**Files:**
- Modifica: `src/lib/send-followup.test.ts`

I test vanno scritti **prima** dell'implementazione (TDD). Vedremo i test fallire al Step 2, poi passeranno dopo il Task 5.

- [ ] **Step 1: Aggiungi i fixture e i test in `src/lib/send-followup.test.ts`**

Aggiungi dopo la riga `const EXISTING_TOKEN = ...` (riga 40) il fixture:

```ts
const QUOTE_INVIATO = {
  id: 'q-1',
  number: 'PRV-001',
  status: 'inviato',
  validity_days: 30,
  client: { name: 'Mario Rossi', email: 'mario@example.com' },
  sender: { name: 'Acme Srl', email: 'acme@example.com' },
};
```

Poi aggiungi alla fine del `describe('executeSendFollowUp', ...)` (prima della chiusura `}`) i seguenti tre test:

```ts
  it('happy path — aggiorna stato preventivo a follow_up_inviato quando era inviato', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    // Track update su quotes
    const quotesEqFn = vi.fn().mockReturnThis();
    const quotesUpdateResult = { eq: quotesEqFn };
    const quotesUpdateFn = vi.fn().mockReturnValue(quotesUpdateResult);

    const quotesChain = chainReturning({ data: QUOTE_INVIATO, error: null });
    quotesChain.update = quotesUpdateFn;

    // Track insert su notifications
    const notificationsInsertFn = vi.fn().mockResolvedValue({ data: null, error: null });
    const notificationsChain = chainReturning({ data: null, error: null });
    notificationsChain.insert = notificationsInsertFn;

    const updateFollowupFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFollowupFn;

    const tokensChain = chainReturning({ data: EXISTING_TOKEN, error: null });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
      notifications: notificationsChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(true);

    // Verifica aggiornamento stato preventivo
    expect(quotesUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'follow_up_inviato' })
    );
    // Verifica che il filtro condizionale su status sia presente
    expect(quotesEqFn).toHaveBeenCalledWith('status', 'inviato');

    // Verifica notifica in-app
    expect(notificationsInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        type: 'followup_sent',
        quote_id: FOLLOWUP.quote_id,
      })
    );

    // Verifica email al mittente (seconda chiamata Resend)
    expect(mockEmailsSend).toHaveBeenCalledTimes(2);
    const ownerEmailCall = mockEmailsSend.mock.calls[1][0];
    expect(ownerEmailCall.to).toBe('acme@example.com');
    expect(ownerEmailCall.subject).toContain('PRV-001');
  });

  it('non invia email al mittente se sender.email è assente', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    // QUOTE senza email mittente
    const quoteSenzaEmail = {
      ...QUOTE_INVIATO,
      sender: { name: 'Acme Srl' }, // nessuna email
    };

    const quotesChain = chainReturning({ data: quoteSenzaEmail, error: null });
    const updateFollowupFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFollowupFn;
    const tokensChain = chainReturning({ data: EXISTING_TOKEN, error: null });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(true);
    // Solo l'email al cliente, nessuna al mittente
    expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it('logga errore ma non fallisce se la notifica in-app fallisce', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const quotesChain = chainReturning({ data: QUOTE_INVIATO, error: null });

    const notifError = { message: 'insert failed' };
    const notificationsInsertFn = vi.fn().mockResolvedValue({ data: null, error: notifError });
    const notificationsChain = chainReturning({ data: null, error: null });
    notificationsChain.insert = notificationsInsertFn;

    const updateFollowupFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFollowupFn;
    const tokensChain = chainReturning({ data: EXISTING_TOKEN, error: null });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
      notifications: notificationsChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(true);
    expect(mockLogError).toHaveBeenCalledWith('send-followup.notification-insert', notifError);
  });
```

Nota: il test usa `FOLLOWUP.user_id` ma il fixture `FOLLOWUP` attuale non ha `user_id`. Aggiorna il fixture `FOLLOWUP` aggiungendo `user_id: 'user-1'`:

```ts
const FOLLOWUP = {
  id: FOLLOWUP_ID,
  quote_id: 'q-1',
  user_id: 'user-1',        // ← aggiunto
  status: 'pending',
  custom_message: 'Ti scrivo per seguire il preventivo.',
};
```

- [ ] **Step 2: Esegui i test per verificare che falliscano**

```bash
npm run test -- send-followup
```
Expected: i tre nuovi test falliscono (le funzionalità non sono ancora implementate). I test esistenti devono continuare a passare.

---

## Task 5: Implementazione step 5a/5b/5c in `executeSendFollowUp`

**Files:**
- Modifica: `src/lib/send-followup.ts`

- [ ] **Step 1: Sostituisci la funzione `executeSendFollowUp`**

Sostituisci l'intero contenuto della funzione con la versione aggiornata. Il file completo diventa:

```ts
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
```

- [ ] **Step 2: Esegui i test**

```bash
npm run test -- send-followup
```
Expected: tutti i test passano (inclusi i tre nuovi del Task 4).

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: nessun errore.

- [ ] **Step 4: Commit**

```bash
git add src/lib/send-followup.ts src/lib/send-followup.test.ts
git commit -m "feat: notify owner on follow-up sent (quote status, in-app, email)"
```

---

## Verifica finale

- [ ] **Esegui tutti i test**

```bash
npm run test
```
Expected: tutti i test passano.

- [ ] **Typecheck finale**

```bash
npm run typecheck
```
Expected: nessun errore.
