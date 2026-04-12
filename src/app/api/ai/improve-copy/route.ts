import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkAIRateLimit } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const IMPROVE_COPY_SYSTEM_PROMPT = `Sei un esperto copywriter specializzato in preventivi B2B italiani.
Il tuo compito è trasformare descrizioni brevi, sbrigative o poco formali in descrizioni professionali, eleganti e ad alto valore percepito per la voce di un preventivo.

REGOLE:
1. Mantieni il significato originale ma eleva il tono.
2. Usa termini business corretti (es. invece di "faccio il sito", usa "Sviluppo integrale di piattaforma web responsive").
3. Sii conciso ma esaustivo (massimo 15-20 parole).
4. Restituisci SOLO il testo migliorato, senza commenti, virgolette o prefissi come "Ecco il testo:".
5. Se il testo fornito è già ottimo, restituiscilo identico o con lievissimi ritocchi formali.
6. Assicurati che il tono sia formale e persuasivo.`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI non configurata' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const schema = z.object({
      text: z.string().min(1, 'Testo vuoto').max(1000),
    });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input non valido' }, { status: 400 });
    }

    // Rate Limit (usiamo il piano dell'utente se possibile, altrimenti free)
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();
    
    const plan = (profile?.plan ?? 'free') as 'free' | 'starter' | 'pro';
    const rl = await checkAIRateLimit(user.id, plan);
    if (!rl.success) {
      return NextResponse.json({ error: 'Troppe richieste. Riprova tra poco.' }, { status: 429 });
    }

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: parsed.data.text }] }],
      config: {
        systemInstruction: IMPROVE_COPY_SYSTEM_PROMPT,
        temperature: 0.3,
      },
    });

    const improvedText = (result.text ?? '').trim();

    return NextResponse.json({ improvedText });
  } catch (error) {
    console.error('Improve copy error:', error);
    return NextResponse.json({ error: 'Errore durante il miglioramento del testo' }, { status: 500 });
  }
}
