import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    throw new Error('Test errore server-side Sentry!');
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: true, message: 'Errore catturato e inviato a Sentry' });
  }
}
