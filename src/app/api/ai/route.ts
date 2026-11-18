import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { checkQuota } from '@/lib/quota';
import { checkAIRateLimit } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { MAX_HISTORY_MESSAGES, SYSTEM_PROMPT, sanitizeAIResult } from '@/lib/ai/quote-assistant';

// La chiave è letta solo server-side da variabile d'ambiente
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
      message: z.string().min(1, 'Messaggio vuoto').max(2000, 'Messaggio troppo lungo (max 2000 caratteri)'),
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
      ...history.slice(-MAX_HISTORY_MESSAGES).map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user' as const, parts: [{ text: contextPrefix + message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    return NextResponse.json(sanitizeAIResult(response.text ?? ''));
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
