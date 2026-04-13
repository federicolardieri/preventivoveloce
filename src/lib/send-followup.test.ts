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
});
