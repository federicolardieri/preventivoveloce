import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkQuota } from '@/lib/quota';

// La chiave è letta solo server-side da variabile d'ambiente
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_PROMPT = `Sei un assistente per la compilazione di preventivi professionali italiani.
L'utente descrive i dati in linguaggio naturale, tu li estrai e restituisci SOLO un JSON valido.

FORMATO RISPOSTA OBBLIGATORIO (nessun testo fuori dal JSON):
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

REGOLE CRITICHE:
1. Usa ESATTAMENTE questi nomi di campo: name, address, city, postalCode, country, vatNumber, email, phone
2. NON usare: company, vat, cap, indirizzo, piva o qualsiasi altro nome alternativo
3. unitPrice è in CENTESIMI interi (€100 = 10000, €1500 = 150000, €80,50 = 8050)
4. vatRate deve essere SOLO uno di questi numeri: 0, 4, 10, 22
5. Includi SOLO le sezioni menzionate dall'utente (ometti client se non citato, ecc.)
6. Se l'utente saluta o fa domande generiche: {"action":"chat","message":"la tua risposta"}
7. Non inventare dati non menzionati
8. Rispondi sempre in italiano`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI non configurata' }, { status: 500 });
    }

    const { message, history, quoteId } = await req.json() as {
      message: string;
      history: { role: 'user' | 'model'; text: string }[];
      quoteId?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Messaggio vuoto' }, { status: 400 });
    }

    // ── Controllo quota server-side ──────────────────────────────────────────
    // Blocca solo se il messaggio tenta di generare un preventivo (action fill_quote)
    // Il controllo definitivo avviene anche in /api/pdf, ma blocchiamo qui per UX
    if (quoteId !== undefined) {
      const quota = await checkQuota(quoteId);
      if (!quota.allowed) {
        return NextResponse.json({
          error: 'quota_exceeded',
          plan: quota.plan,
          message: quota.message ?? 'Limite raggiunto. Passa a un piano superiore.',
        }, { status: 403 });
      }
    }

    // Costruisce la cronologia per il contesto multi-turno
    const contents = [
      ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user' as const, parts: [{ text: message }] },
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

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = { action: 'chat', message: rawText };
    }

    return NextResponse.json(parsed);
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
