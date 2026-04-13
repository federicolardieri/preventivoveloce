import { describe, it, expect } from 'vitest';
import {
  FOLLOWUP_TEMPLATES,
  getTemplatePreviewText,
  type FollowUpTemplateId,
} from './followup-templates';

describe('FOLLOWUP_TEMPLATES', () => {
  it('ha 2 template predefiniti', () => {
    expect(FOLLOWUP_TEMPLATES).toHaveLength(2);
  });

  it('reminder_1 include il nome cliente e il numero preventivo', () => {
    const t = FOLLOWUP_TEMPLATES.find(t => t.id === 'reminder_1')!;
    const text = t.getText({ clientName: 'Mario Rossi', quoteNumber: 'PRV-001', validityDays: 30 });
    expect(text).toContain('Mario Rossi');
    expect(text).toContain('PRV-001');
  });

  it('reminder_2 include i giorni di validità', () => {
    const t = FOLLOWUP_TEMPLATES.find(t => t.id === 'reminder_2')!;
    const text = t.getText({ clientName: 'Luca', quoteNumber: 'PRV-002', validityDays: 14 });
    expect(text).toContain('14');
  });
});

describe('getTemplatePreviewText', () => {
  const params = { clientName: 'Mario', quoteNumber: 'PRV-001', validityDays: 30 };

  it('restituisce il testo del template reminder_1', () => {
    const text = getTemplatePreviewText('reminder_1', params);
    expect(text).toContain('Mario');
    expect(text).toContain('PRV-001');
  });

  it('restituisce stringa vuota per custom', () => {
    const text = getTemplatePreviewText('custom', params);
    expect(text).toBe('');
  });
});
