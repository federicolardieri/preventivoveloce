import * as Sentry from '@sentry/nextjs';

/**
 * Log strutturato di un errore: in dev finisce in console (per debug locale),
 * in produzione viene inviato a Sentry con area tag e extra context.
 * Il beforeSend di Sentry (src/lib/sentry-scrub.ts) sanifica automaticamente
 * i campi sensibili prima dell'invio.
 */
export function logError(
  area: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${area}]`, err, extra ?? '');
  }
  Sentry.captureException(err, {
    tags: { area },
    extra,
  });
}
