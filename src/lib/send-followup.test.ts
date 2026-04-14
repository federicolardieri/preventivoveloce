import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────
const mockLogError = vi.fn();

vi.mock('@/lib/logger', () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

const mockEmailsSend = vi.fn();

vi.mock('resend', () => ({
  Resend: function () {
    return {
      emails: { send: mockEmailsSend },
    };
  },
}));

const { executeSendFollowUp } = await import('./send-followup');

// ── Fixtures ───────────────────────────────────────────────────
const FOLLOWUP_ID = 'fu-1';

const FOLLOWUP = {
  id: FOLLOWUP_ID,
  quote_id: 'q-1',
  user_id: 'user-1',
  status: 'pending',
  custom_message: 'Ti scrivo per seguire il preventivo.',
};

const QUOTE = {
  id: 'q-1',
  number: 'PRV-001',
  validity_days: 30,
  client: { name: 'Mario Rossi', email: 'mario@example.com' },
  sender: { name: 'Acme Srl' },
};

const EXISTING_TOKEN = { token: 'existing-token-abc' };

const QUOTE_INVIATO = {
  id: 'q-1',
  number: 'PRV-001',
  status: 'inviato',
  validity_days: 30,
  client: { name: 'Mario Rossi', email: 'mario@example.com' },
  sender: { name: 'Acme Srl', email: 'acme@example.com' },
};

// ── Builder helpers ────────────────────────────────────────────

/**
 * Builds a minimal Supabase query chain mock.
 * `result` is what `.single()` / `.maybeSingle()` / terminal awaits return.
 */
function chainReturning(result: unknown) {
  const terminal = vi.fn().mockResolvedValue(result);
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue(result),
    single: terminal,
    maybeSingle: terminal,
  };
  // Make every method return `this` by default so chains don't break
  for (const key of Object.keys(chain)) {
    if (typeof chain[key] === 'function' && key !== 'insert' && key !== 'single' && key !== 'maybeSingle') {
      (chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
    }
  }
  return chain;
}

/**
 * Builds a complete adminClient mock.
 *
 * @param overrides  Map of tableName → query chain. Tables not listed fall back
 *                   to a chain that resolves to `{ data: null, error: null }`.
 */
function buildAdminClient(overrides: Record<string, ReturnType<typeof chainReturning>>) {
  return {
    from: vi.fn((table: string) => {
      return overrides[table] ?? chainReturning({ data: null, error: null });
    }),
  };
}

// ── Tests ──────────────────────────────────────────────────────
describe('executeSendFollowUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok: false when followup is not found', async () => {
    const followupsChain = chainReturning({ data: null, error: { message: 'not found' } });
    const adminClient = buildAdminClient({ quote_followups: followupsChain });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns ok: false and updates status to failed when quote is not found', async () => {
    // followup found OK
    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    // quotes not found
    const quotesChain = chainReturning({ data: null, error: { message: 'quote not found' } });

    // We need to track the update call on quote_followups separately
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    followupsChain.update = updateFn;

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Preventivo');
    expect(updateFn).toHaveBeenCalledWith({ status: 'failed' });
  });

  it('returns ok: false and updates status to failed when client email is missing', async () => {
    const quoteWithoutEmail = {
      ...QUOTE,
      client: { name: 'Mario Rossi', email: undefined },
    };

    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFn;

    const quotesChain = chainReturning({ data: quoteWithoutEmail, error: null });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Email');
    expect(updateFn).toHaveBeenCalledWith({ status: 'failed' });
  });

  it('returns ok: false and calls logError when token insert fails', async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFn;

    const quotesChain = chainReturning({ data: QUOTE, error: null });

    // No existing token
    const tokensChain = chainReturning({ data: null, error: null });
    // Insert fails
    const tokenInsertError = { message: 'insert failed' };
    tokensChain.insert = vi.fn().mockResolvedValue({ data: null, error: tokenInsertError });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('token');
    expect(mockLogError).toHaveBeenCalledWith('send-followup.token-insert', tokenInsertError);
    expect(updateFn).toHaveBeenCalledWith({ status: 'failed' });
  });

  it('returns ok: true but calls logError when final status update fails after email sent', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    // quote_followups: first call returns followup; update returns an error
    const updateError = { message: 'update failed' };
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: updateError }) });

    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFn;

    const quotesChain = chainReturning({ data: QUOTE, error: null });

    // Existing token found
    const tokensChain = chainReturning({ data: EXISTING_TOKEN, error: null });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(true);
    expect(mockLogError).toHaveBeenCalledWith(
      'send-followup.status-update',
      updateError,
      { followupId: FOLLOWUP_ID }
    );
  });

  it('returns ok: false and calls logError when Resend fails to send the email', async () => {
    const resendError = { message: 'resend error' };
    mockEmailsSend.mockResolvedValue({ data: null, error: resendError });

    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFn;

    const quotesChain = chainReturning({ data: QUOTE, error: null });

    // Existing token found
    const tokensChain = chainReturning({ data: EXISTING_TOKEN, error: null });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('email');
    expect(mockLogError).toHaveBeenCalledWith('send-followup.resend', resendError);
    expect(updateFn).toHaveBeenCalledWith({ status: 'failed' });
  });

  it('happy path — reuses existing token and sends email once', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });

    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFn;

    const quotesChain = chainReturning({ data: QUOTE, error: null });

    // Existing token found — no insert should happen
    const tokensChain = chainReturning({ data: EXISTING_TOKEN, error: null });
    const insertFn = vi.fn();
    tokensChain.insert = insertFn;

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(true);
    expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    expect(insertFn).not.toHaveBeenCalled();
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it('happy path — aggiorna stato preventivo a follow_up_inviato quando era inviato', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    // Track update su quotes
    const quotesEqFn = vi.fn().mockReturnThis();
    const quotesUpdateResult = { eq: quotesEqFn };
    const quotesUpdateFn = vi.fn().mockReturnValue(quotesUpdateResult);

    const quotesChain = chainReturning({ data: QUOTE_INVIATO, error: null });
    quotesChain.update = quotesUpdateFn;

    // Track insert su notifications
    const notificationsInsertFn = vi.fn().mockResolvedValue({ data: null, error: null });
    const notificationsChain = chainReturning({ data: null, error: null });
    notificationsChain.insert = notificationsInsertFn;

    const updateFollowupFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFollowupFn;

    const tokensChain = chainReturning({ data: EXISTING_TOKEN, error: null });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
      notifications: notificationsChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(true);

    // Verifica aggiornamento stato preventivo
    expect(quotesUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'follow_up_inviato' })
    );
    // Verifica che il filtro condizionale su status sia presente
    expect(quotesEqFn).toHaveBeenCalledWith('status', 'inviato');

    // Verifica notifica in-app
    expect(notificationsInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        type: 'followup_sent',
        quote_id: FOLLOWUP.quote_id,
      })
    );

    // Verifica email al mittente (seconda chiamata Resend)
    expect(mockEmailsSend).toHaveBeenCalledTimes(2);
    const ownerEmailCall = mockEmailsSend.mock.calls[1][0];
    expect(ownerEmailCall.to).toBe('acme@example.com');
    expect(ownerEmailCall.subject).toContain('PRV-001');
  });

  it('non invia email al mittente se sender.email è assente', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    // QUOTE senza email mittente
    const quoteSenzaEmail = {
      ...QUOTE_INVIATO,
      sender: { name: 'Acme Srl' }, // nessuna email
    };

    const quotesChain = chainReturning({ data: quoteSenzaEmail, error: null });
    const updateFollowupFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFollowupFn;
    const tokensChain = chainReturning({ data: EXISTING_TOKEN, error: null });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(true);
    // Solo l'email al cliente, nessuna al mittente
    expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it('logga errore ma non fallisce se la notifica in-app fallisce', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

    const quotesChain = chainReturning({ data: QUOTE_INVIATO, error: null });

    const notifError = { message: 'insert failed' };
    const notificationsInsertFn = vi.fn().mockResolvedValue({ data: null, error: notifError });
    const notificationsChain = chainReturning({ data: null, error: null });
    notificationsChain.insert = notificationsInsertFn;

    const updateFollowupFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    const followupsChain = chainReturning({ data: FOLLOWUP, error: null });
    followupsChain.update = updateFollowupFn;
    const tokensChain = chainReturning({ data: EXISTING_TOKEN, error: null });

    const adminClient = buildAdminClient({
      quote_followups: followupsChain,
      quotes: quotesChain,
      quote_tokens: tokensChain,
      notifications: notificationsChain,
    });

    const result = await executeSendFollowUp(FOLLOWUP_ID, adminClient as never);

    expect(result.ok).toBe(true);
    expect(mockLogError).toHaveBeenCalledWith('send-followup.notification-insert', notifError);
  });
});
