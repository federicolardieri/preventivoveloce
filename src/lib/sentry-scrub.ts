import type { ErrorEvent } from '@sentry/nextjs';

const SENSITIVE_KEY_FRAGMENTS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'stripe_customer_id',
  'vat_number',
  'iban',
  'signature',
  'api_key',
  'apikey',
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[Truncated]';
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      result[key] = '[Redacted]';
    } else {
      result[key] = scrubValue(val, depth + 1);
    }
  }
  return result;
}

/**
 * beforeSend hook per Sentry che rimuove chiavi sensibili da extra, contexts,
 * request data/headers/cookies prima dell'invio. Usato in tutti i Sentry.init
 * (client, server, edge, instrumentation-client) per evitare fughe di PII.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.extra) {
    event.extra = scrubValue(event.extra) as ErrorEvent['extra'];
  }
  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as ErrorEvent['contexts'];
  }
  if (event.request) {
    if (event.request.data) {
      event.request.data = scrubValue(event.request.data) as typeof event.request.data;
    }
    if (event.request.cookies) {
      delete event.request.cookies;
    }
    if (event.request.headers) {
      event.request.headers = scrubValue(event.request.headers) as typeof event.request.headers;
    }
  }
  return event;
}
