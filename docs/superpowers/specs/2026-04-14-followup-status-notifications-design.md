# Design: Stato "Follow-up Inviato" + Notifiche

**Data:** 2026-04-14  
**Scope:** Aggiunta stato `follow_up_inviato` al preventivo, notifica in-app e email al mittente quando un follow-up viene inviato al cliente.

---

## Contesto

Quando viene inviato un follow-up al cliente tramite `executeSendFollowUp`, attualmente:
- Lo stato del preventivo **non cambia**
- L'utente (mittente) **non riceve nessuna notifica** in-app né via email

Questo design aggiunge tutte e tre le funzionalità.

---

## Requisiti

1. Se un follow-up viene inviato con successo e lo stato del preventivo è `inviato`, aggiornarlo a `follow_up_inviato`.
2. Creare una notifica in-app di tipo `followup_sent` visibile nello storico notifiche.
3. Inviare un'email al mittente (a `quoteRow.sender.email`) con riepilogo e link allo storico preventivi.
4. Il badge `follow_up_inviato` appare sia nello storico normale che nell'archivio.

---

## Architettura

### Migration SQL

Nuova migration `20260414_000_followup_status.sql`:

```sql
-- Aggiunge CHECK su quotes.status (la colonna non aveva un constraint esistente)
ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check
    CHECK (status IN ('bozza','da_inviare','inviato','follow_up_inviato','accettato','rifiutato','scaduto'));

-- Allarga CHECK su notifications.type
-- Il constraint inline genera automaticamente il nome notifications_type_check in PostgreSQL
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('credits_low','credits_empty','quote_sent','quote_accepted','followup_sent'));
```

### Tipo TypeScript — `types/quote.ts`

```ts
export type QuoteStatus =
  | 'bozza'
  | 'da_inviare'
  | 'inviato'
  | 'follow_up_inviato'   // ← nuovo
  | 'accettato'
  | 'rifiutato'
  | 'scaduto';
```

### Schema Zod — `schemas/quoteSchema.ts`

Aggiungere `'follow_up_inviato'` all'enum `status`.

### `executeSendFollowUp` — `lib/send-followup.ts`

Dopo la conferma dell'invio email al cliente (step 4 nel codice esistente), prima di aggiornare `quote_followups.status`:

**Step 5a — Aggiorna stato preventivo (condizionale):**
```ts
await adminClient
  .from('quotes')
  .update({ status: 'follow_up_inviato', updated_at: new Date().toISOString() })
  .eq('id', followup.quote_id)
  .eq('status', 'inviato'); // solo se era 'inviato'
```
Il fallimento di questo update non blocca il flusso.

**Step 5b — Notifica in-app:**
```ts
await adminClient.from('notifications').insert({
  user_id: followup.user_id,
  type: 'followup_sent',
  title: 'Follow-up inviato',
  message: `Il follow-up per il preventivo ${quoteRow.number} è stato inviato a ${clientName}.`,
  quote_id: followup.quote_id,
});
```
Il fallimento non blocca il flusso.

**Step 5c — Email al mittente:**

Invia via Resend a `quoteRow.sender.email` (se presente):
- **From:** `Preventivo Veloce <preventivi@ilpreventivoveloce.it>`
- **Subject:** `Follow-up inviato — Preventivo {number}`
- **Body:** HTML in stile brand (header viola, stesso look di `buildNotifySenderHtml` in `firma/[token]/route.ts`)
  - "Il follow-up per il preventivo **PRV-XXX** è stato inviato a **[nome cliente]** ([email cliente])."
  - CTA "Vai allo storico →" → `{SITE_URL}/preventivi`

Il fallimento non blocca il flusso (lo logga ma non fa fallire la response).

### UI — `QuoteStatusBadge.tsx`

```ts
follow_up_inviato: {
  label: 'Follow-up inviato',
  className: 'bg-violet-100 text-violet-800 border-violet-200',
},
```

---

## Gestione errori

- I tre step post-invio (aggiorna stato, notifica in-app, email mittente) sono **best-effort**: un errore viene loggato con `logError` ma non fa fallire la response né cambia lo stato del follow-up.
- Solo l'invio email al cliente è bloccante (già gestito nel codice esistente).

---

## Testing

- Unit test in `send-followup.test.ts`: verificare che dopo un invio riuscito vengano chiamati update su `quotes`, insert su `notifications` e `resend.emails.send` una seconda volta (per il mittente).
- Verificare che se lo stato del preventivo è `accettato` (non `inviato`), lo stato **non** cambi.

---

## File coinvolti

| File | Tipo di modifica |
|------|-----------------|
| `supabase/migrations/20260414_000_followup_status.sql` | Nuovo |
| `src/types/quote.ts` | Modifica (aggiunge `follow_up_inviato`) |
| `src/schemas/quoteSchema.ts` | Modifica (aggiunge `follow_up_inviato` all'enum) |
| `src/lib/send-followup.ts` | Modifica (aggiunge step 5a/5b/5c) |
| `src/components/quotes-list/QuoteStatusBadge.tsx` | Modifica (aggiunge badge) |
| `src/lib/send-followup.test.ts` | Modifica (aggiunge test nuovi step) |
