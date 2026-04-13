export type FollowUpTemplateId = 'reminder_1' | 'reminder_2' | 'custom';

export interface FollowUpTemplate {
  id: FollowUpTemplateId;
  label: string;
  getText: (params: { clientName: string; quoteNumber: string; validityDays: number }) => string;
}

export const FOLLOWUP_TEMPLATES: FollowUpTemplate[] = [
  {
    id: 'reminder_1',
    label: 'Sollecito gentile',
    getText: ({ clientName, quoteNumber }) =>
      `Gentile ${clientName},\n\nvolevo verificare se hai avuto modo di valutare il preventivo ${quoteNumber} che ti ho inviato.\n\nResto a disposizione per qualsiasi domanda o chiarimento.\n\nCordiali saluti`,
  },
  {
    id: 'reminder_2',
    label: 'Urgenza scadenza',
    getText: ({ clientName, quoteNumber, validityDays }) =>
      `Gentile ${clientName},\n\nti ricordo che il preventivo ${quoteNumber} scadrà tra ${validityDays} giorni.\n\nSe sei interessato, ti invito ad accettarlo prima della scadenza o a contattarmi per qualsiasi informazione.\n\nCordiali saluti`,
  },
];

/** Testo pre-compilato per la textarea del dialog (vuoto per 'custom'). */
export function getTemplatePreviewText(
  templateId: FollowUpTemplateId,
  params: { clientName: string; quoteNumber: string; validityDays: number }
): string {
  if (templateId === 'custom') return '';
  return FOLLOWUP_TEMPLATES.find(t => t.id === templateId)?.getText(params) ?? '';
}
