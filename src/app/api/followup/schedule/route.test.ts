import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────
const mockExecuteSend = vi.fn();
vi.mock('@/lib/send-followup', () => ({
  executeSendFollowUp: (...args: unknown[]) => mockExecuteSend(...args),
}));

// Insert mockabile per quote_followups
const mockInsertSelect = vi.fn();
const mockQuoteSelect = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } } }) },
    from: (table: string) => {
      if (table === 'quotes') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ single: mockQuoteSelect }) }) }),
        };
      }
      return {};
    },
  }),
  createAdminClient: () => ({
    from: () => ({
      insert: () => ({ select: () => ({ single: mockInsertSelect }) }),
    }),
  }),
}));

const { POST } = await import('./route');

function makeRequest(body: unknown): NextRequest {
  return new Request('http://localhost/api/followup/schedule', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as NextRequest;
}

// ── Tests ──────────────────────────────────────────────────────
describe('POST /api/followup/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuoteSelect.mockResolvedValue({ data: { id: 'quote-1' }, error: null });
    mockInsertSelect.mockResolvedValue({ data: { id: 'fu-1' }, error: null });
    mockExecuteSend.mockResolvedValue({ ok: true });
  });

  it('returns 400 when quoteId is missing', async () => {
    const res = await POST(makeRequest({
      templateId: 'reminder_1',
      customMessage: 'ciao',
      scheduledFor: null,
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when scheduledFor is in the past', async () => {
    const res = await POST(makeRequest({
      quoteId: '00000000-0000-0000-0000-000000000001',
      templateId: 'reminder_1',
      customMessage: 'ciao',
      scheduledFor: '2020-01-01T10:00:00Z',
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when templateId is invalid', async () => {
    const res = await POST(makeRequest({
      quoteId: '00000000-0000-0000-0000-000000000001',
      templateId: 'fake',
      customMessage: 'ciao',
      scheduledFor: null,
    }));
    expect(res.status).toBe(400);
  });

  it('returns 200 and calls executeSendFollowUp for immediate send', async () => {
    const res = await POST(makeRequest({
      quoteId: '00000000-0000-0000-0000-000000000001',
      templateId: 'reminder_1',
      customMessage: 'Gentile Mario...',
      scheduledFor: null,
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.immediate).toBe(true);
    expect(mockExecuteSend).toHaveBeenCalledWith('fu-1', expect.anything());
  });

  it('returns 200 and does NOT call executeSendFollowUp for scheduled send', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const res = await POST(makeRequest({
      quoteId: '00000000-0000-0000-0000-000000000001',
      templateId: 'reminder_2',
      customMessage: 'Reminder scadenza...',
      scheduledFor: future,
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.immediate).toBeUndefined();
    expect(mockExecuteSend).not.toHaveBeenCalled();
  });
});
