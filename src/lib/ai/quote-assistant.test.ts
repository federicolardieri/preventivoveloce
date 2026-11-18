import { describe, expect, it } from 'vitest';
import { OFF_TOPIC_MESSAGE, sanitizeAIResult } from './quote-assistant';

const offTopic = { action: 'chat', message: OFF_TOPIC_MESSAGE };

describe('sanitizeAIResult', () => {
  it('passes through a valid fill_quote result', () => {
    const raw = JSON.stringify({
      action: 'fill_quote',
      message: 'Fatto!',
      fields: { items: [{ description: 'Consulenza', quantity: 3, unitPrice: 50000, vatRate: 22 }] },
    });
    expect(sanitizeAIResult(raw)).toEqual(JSON.parse(raw));
  });

  it('passes through a short chat reply', () => {
    const raw = JSON.stringify({ action: 'chat', message: 'Qual è la P.IVA del cliente?' });
    expect(sanitizeAIResult(raw)).toEqual(JSON.parse(raw));
  });

  it('rejects non-JSON output', () => {
    expect(sanitizeAIResult('Ecco lo script: print("ciao")')).toEqual(offTopic);
  });

  it('rejects unknown actions', () => {
    expect(sanitizeAIResult(JSON.stringify({ action: 'run_code', message: 'ok' }))).toEqual(offTopic);
  });

  it('rejects messages containing code fences', () => {
    const raw = JSON.stringify({ action: 'chat', message: 'Ecco:\n```python\nprint("ciao")\n```' });
    expect(sanitizeAIResult(raw)).toEqual(offTopic);
  });

  it('rejects overly long chat messages', () => {
    const raw = JSON.stringify({ action: 'chat', message: 'a'.repeat(401) });
    expect(sanitizeAIResult(raw)).toEqual(offTopic);
  });
});
