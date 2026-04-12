import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkQuota } from '@/lib/quota';
import { checkAIRateLimit } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// La chiave è letta solo server-side da variabile d'ambiente
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_PROMPT = `Sei un assistente per la compilazione di preventivi professionali italiani.
L'utente descrive i dati in linguaggio naturale, tu li estrai e restituisci SOLO un JSON valido.

Hai 3 azioni disponibili:

═══ 1. AGGIUNGERE/COMPILARE DATI ═══
{
  "action": "fill_quote",
  "message": "Breve risposta amichevole (max 2 frasi)",
  "fields": {
    "client": {
      "name": "nome completo persona o ragione sociale azienda",
      "address": "via e numero civico",
      "city": "città",
      "postalCode": "CAP",
      "country": "paese",
      "vatNumber": "partita IVA o codice fiscale",
      "email": "indirizzo email",
      "phone": "numero di telefono"
    },
    "sender": {
      "name": "nome completo o ragione sociale mittente",
      "address": "via e numero civico",
      "city": "città",
      "postalCode": "CAP",
      "country": "paese",
      "vatNumber": "partita IVA",
      "email": "email",
      "phone": "telefono"
    },
    "details": {
      "notes": "note generali",
      "paymentTerms": "termini di pagamento",
      "validityDays": 30
    },
    "items": [
      {
        "description": "descrizione voce",
        "quantity": 1,
        "unitPrice": 10000,
        "discount": 0,
        "discountType": "percentage",
        "vatRate": 22
      }
    ]
  }
}

═══ 2. MODIFICARE VOCI ESISTENTI ═══
Quando l'utente vuole cambiare prezzo, quantità, descrizione o altri campi di una voce già inserita.
Usa l'indice della voce (partendo da 0) dal contesto QUOTE_ITEMS fornito.
{
  "action": "update_items",
  "message": "Breve risposta amichevole",
  "updates": [
    {
      "index": 0,
      "fields": {
        "description": "nuova descrizione",
        "quantity": 2,
        "unitPrice": 15000,
        "discount": 10,
        "discountType": "percentage",
        "vatRate": 22
      }
    }
  ]
}
Includi in "fields" SOLO i campi da modificare, ometti quelli che restano invariati.

═══ 3. RIMUOVERE VOCI ═══
Quando l'utente vuole eliminare una o più voci dal preventivo.
Usa l'indice della voce (partendo da 0) dal contesto QUOTE_ITEMS fornito.
{
  "action": "remove_items",
  "message": "Breve risposta amichevole",
  "indices": [0, 2]
}

═══ CHAT GENERICA ═══
Se l'utente saluta o fa domande generiche:
{"action":"chat","message":"la tua risposta"}

REGOLE CRITICHE:
1. Usa ESATTAMENTE questi nomi di campo: name, address, city, postalCode, country, vatNumber, email, phone
2. NON usare: company, vat, cap, indirizzo, piva o qualsiasi altro nome alternativo
3. unitPrice è in CENTESIMI interi (€100 = 10000, €1500 = 150000, €80,50 = 8050)
4. vatRate deve essere SOLO uno di questi numeri: 0, 4, 10, 22
5. Includi SOLO le sezioni menzionate dall'utente (ometti client se non citato, ecc.)
6. Non inventare dati non menzionati
7. Rispondi sempre in italiano
8. Per update_items e remove_items, usa SEMPRE l'indice numerico dalla lista QUOTE_ITEMS
9. Se l'utente dice "rimuovi la seconda voce" → indice 1 (partendo da 0)
10. Se non riesci a individuare la voce giusta, chiedi chiarimenti`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI non configurata' }, { status: 500 });
    }

    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const aiSchema = z.object({
      message: z.string().min(1, 'Messaggio vuoto').max(5000),
      history: z.array(z.object({
        role: z.enum(['user', 'model']),
        text: z.string().max(5000),
      })).max(50).default([]),
      quoteId: z.string().uuid().optional(),
      currentItems: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        vatRate: z.number(),
        discount: z.number().optional(),
      })).max(100).default([]),
    });

    const parsed = aiSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Input non valido' }, { status: 400 });
    }
    const { message, history, quoteId, currentItems } = parsed.data;

    // ── Controllo quota + rate limit ─────────────────────────────────────────
    const quota = quoteId !== undefined ? await checkQuota(quoteId) : null;

    if (quota && !quota.allowed) {
      return NextResponse.json({
        error: 'quota_exceeded',
        plan: quota.plan,
        message: quota.message ?? 'Limite raggiunto. Passa a un piano superiore.',
      }, { status: 403 });
    }

    // Rate limit applicato sempre, indipendentemente dal quoteId
    const plan = quota?.plan ?? 'free';
    const rl = await checkAIRateLimit(user.id, plan);
    if (!rl.success) {
      const resetIn = Math.ceil((rl.reset - Date.now()) / 1000);
      return NextResponse.json({
        error: 'rate_limit_exceeded',
        message: `Troppe richieste. Riprova tra ${resetIn} secondi.`,
        remaining: 0,
        resetIn,
      }, { status: 429 });
    }

    // Costruisce la cronologia per il contesto multi-turno
    // Inietta le voci correnti come contesto per l'AI
    let contextPrefix = '';
    if (currentItems.length > 0) {
      const itemsList = currentItems.map((item, i) =>
        `  [${i}] "${item.description}" — qty: ${item.quantity}, prezzo: €${(item.unitPrice / 100).toFixed(2)}, IVA: ${item.vatRate}%${item.discount ? `, sconto: ${item.discount}%` : ''}`
      ).join('\n');
      contextPrefix = `QUOTE_ITEMS (voci attualmente nel preventivo):\n${itemsList}\n\nRICHIESTA UTENTE: `;
    }

    const contents = [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user' as const, parts: [{ text: contextPrefix + message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
      },
    });

    const rawText = response.text ?? '';

    // Estrae il JSON dalla risposta
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) ||
                      rawText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : rawText;

    let aiResult: Record<string, unknown>;
    try {
      aiResult = JSON.parse(jsonStr.trim());
    } catch {
      aiResult = { action: 'chat', message: rawText };
    }

    return NextResponse.json(aiResult);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('AI route error:', msg);

    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return NextResponse.json(
        { error: 'Limite di richieste raggiunto. Riprova tra qualche secondo.' },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: 'Errore del servizio AI' }, { status: 500 });
  }
}
