# Design: Follow-up Preventivi

**Data:** 2026-04-13  
**Stato:** Approvato

---

## Panoramica

Aggiungere la possibilità di inviare un'email di follow-up per qualsiasi preventivo, in modo istantaneo oppure programmato con orario. Il follow-up è accessibile sia dalla lista preventivi che dalla pagina di dettaglio.

---

## Modello Dati

### Nuova tabella `quote_followups`

```sql
CREATE TABLE public.quote_followups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id       uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for  timestamptz,           -- NULL = inviato immediatamente
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'sent', 'failed')),
  template_id    text NOT NULL          -- 'reminder_1' | 'reminder_2' | 'custom'
                   CHECK (template_id IN ('reminder_1', 'reminder_2', 'custom')),
  custom_message text NOT NULL DEFAULT '',
  sent_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.quote_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own followups"
  ON public.quote_followups
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- `scheduled_for NULL` significa invio immediato (il record viene creato già con `status = 'sent'` dopo l'invio diretto).
- `template_id = 'custom'` significa che l'utente ha scritto o modificato il testo liberamente.

---

## Architettura

```
UI (FollowUpDialog)
  │
  ├── Immediato → POST /api/email/send-followup  (diretta)
  │                     │
  │                     └── Resend → email cliente
  │
  └── Programmato → POST /api/followup/schedule  (salva in DB)
                          │
                    [pg_cron ogni 5min]
                          │
                    pg_net → POST /api/email/send-followup
                                   │
                                   └── Resend → email cliente
```

---

## API Routes

### `POST /api/followup/schedule`

Autenticata (Supabase Auth). Salva un follow-up programmato.

**Body:**
```json
{
  "quoteId": "uuid",
  "scheduledFor": "2026-04-16T09:00:00Z",
  "templateId": "reminder_1",
  "customMessage": "Testo opzionale personalizzato"
}
```

**Validazione (Zod):**
- `quoteId`: uuid valido
- `scheduledFor`: ISO datetime, deve essere nel futuro
- `templateId`: uno dei valori ammessi
- `customMessage`: max 1000 caratteri

**Risposta:** `{ ok: true, followupId: "uuid" }`

---

### `POST /api/email/send-followup`

Chiamata da `pg_cron` (via `pg_net`) o direttamente dall'UI per invii immediati.

**Autenticazione:** header `x-webhook-secret: FOLLOWUP_WEBHOOK_SECRET` (env var). Rifiuta con 401 se assente o errato.

**Body:**
```json
{ "followupId": "uuid" }
```

**Flusso:**
1. Verifica secret header
2. Carica follow-up (`status = 'pending'`)
3. Carica preventivo collegato
4. Recupera l'ultimo `quote_token` attivo per il preventivo; se scaduto o assente, ne crea uno nuovo
5. Compone il testo email: se `template_id != 'custom'`, usa il testo del template; altrimenti usa `custom_message`
6. Invia via Resend (stesso `FROM_EMAIL`, stesso layout grafico delle altre email)
7. `UPDATE quote_followups SET status='sent', sent_at=now()`
8. In caso di errore Resend: `status='failed'` + log Sentry, risposta 500

**Risposta:** `{ ok: true }` oppure `{ error: "..." }`

---

## Template Email

Tre template predefiniti inclusi nel codice (non in DB):

| id | Nome UI | Tono |
|---|---|---|
| `reminder_1` | Sollecito gentile | Cordiale — chiede se ha avuto modo di valutare il preventivo |
| `reminder_2` | Urgenza scadenza | Ricorda che il preventivo scade tra N giorni |
| `custom` | Scrivi di tuo | L'utente scrive o modifica da zero |

Il testo dei template viene pre-popolato nella textarea nel dialog e può essere modificato prima dell'invio. Il valore finale finisce sempre in `custom_message`. Se l'utente non modifica nulla rispetto al template, `template_id` rimane `reminder_1` o `reminder_2`; se modifica, diventa `custom`.

Il layout email replica fedelmente `buildClientEmailHtml` in `send-quote/route.ts`: header viola, corpo con messaggio, CTA "Visualizza preventivo" → `/firma/[token]`, footer standard, tracking pixel.

---

## Job pg_cron

```sql
SELECT cron.schedule(
  'process-followups',
  '*/5 * * * *',   -- ogni 5 minuti
  $$
  SELECT net.http_post(
    url := current_setting('app.site_url') || '/api/email/send-followup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', current_setting('app.followup_webhook_secret')
    ),
    body := jsonb_build_object('followupId', id)
  )
  FROM public.quote_followups
  WHERE status = 'pending'
    AND scheduled_for <= now();
  $$
);
```

Il setting `app.site_url` e `app.followup_webhook_secret` vengono configurati nel DB via migration con `ALTER DATABASE ... SET`.

---

## UI: `FollowUpDialog`

Componente `src/components/quote/FollowUpDialog.tsx`. Stesso pattern di `SendQuoteDialog`.

### Step 1 — Timing

```
[ Invia ora ]                        ← bottone primario grande

─── Oppure programma ───

[ Tra 3 giorni ]  [ Tra 1 settimana ]  [ Tra 2 settimane ]

Orario: [ 09:00 ▾ ]                  ← select ore/minuti
```

### Step 2 — Template e messaggio

```
[ Sollecito gentile ]  [ Urgenza scadenza ]  [ Scrivi di tuo ]
                                              ← tab selezionabile

┌─────────────────────────────────────┐
│ Gentile [Nome],                     │  ← textarea pre-compilata
│ volevo verificare se hai avuto...   │     modificabile
└─────────────────────────────────────┘
0/1000
```

### Step 3 — Riepilogo / Invio

```
Destinatario:  cliente@email.com
Invio:         Giovedì 16 aprile alle 09:00
               (oppure "Subito")

[ Annulla ]  [ Conferma e invia / Programma ]
```

Per immediato: spinner "Invio in corso…" → messaggio successo → chiusura.  
Per programmato: messaggio "Follow-up programmato ✓" → chiusura.

---

## Punti di accesso

### Lista preventivi (`/preventivi`)
- Menu azioni (⋯) di ogni riga: voce "Follow-up" con icona `RefreshCw`

### Dettaglio preventivo (`/preventivi/[id]`)
- Bottone "Follow-up" nella barra azioni in alto, accanto al bottone "Invia"

---

## Variabili d'ambiente

| Nome | Dove | Descrizione |
|---|---|---|
| `FOLLOWUP_WEBHOOK_SECRET` | Vercel + `.env.local` + DB setting | Secret per autenticare le chiamate pg_net → API |

---

## Migration SQL

Una singola migration `20260413_002_quote_followups.sql` che:
1. Crea la tabella `quote_followups` con RLS
2. Configura `app.site_url` e `app.followup_webhook_secret` nel DB
3. Schedula il job `pg_cron`

---

## Testing

- Unit test per la funzione di composizione testo template
- Integration test per `POST /api/email/send-followup` (mock Resend, verifica aggiornamento status)
- Integration test per `POST /api/followup/schedule` (verifica validazione e inserimento DB)
- Test di sicurezza: chiamata senza secret → 401
