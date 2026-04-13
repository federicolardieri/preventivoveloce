import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────
const mockExecuteSend = vi.fn();

vi.mock('@/lib/send-followup', () => ({
  executeSendFollowUp: (...args: unknown[]) => mockExecuteSend(...args),
}));

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({}),
}));

const SECRET = 'test-followup-secret-xyz';
process.env.FOLLOWUP_WEBHOOK_SECRET = SECRET;

const { POST } = await import('./route');

function makeRequest(body: unknown, secret?: string): Request {
  return new Request('http://localhost/api/email/send-followup', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(secret !== undefined ? { 'x-webhook-secret': secret } : {}),
    },
  });
}

// ── Tests ──────────────────────────────────────────────────────
describe('POST /api/email/send-followup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when secret header is missing', async () => {
    const res = await POST(makeRequest({ followupId: '00000000-0000-0000-0000-000000000001' }));
    expect(res.status).toBe(401);
    expect(mockExecuteSend).not.toHaveBeenCalled();
  });

  it('returns 401 when secret header is wrong', async () => {
    const res = await POST(makeRequest({ followupId: '00000000-0000-0000-0000-000000000001' }, 'wrong'));
    expect(res.status).toBe(401);
    expect(mockExecuteSend).not.toHaveBeenCalled();
  });

  it('returns 400 when followupId is not a valid uuid', async () => {
    const res = await POST(makeRequest({ followupId: 'not-a-uuid' }, SECRET));
    expect(res.status).toBe(400);
    expect(mockExecuteSend).not.toHaveBeenCalled();
  });

  it('returns 422 when executeSendFollowUp returns ok:false', async () => {
    mockExecuteSend.mockResolvedValue({ ok: false, error: 'Follow-up non trovato' });
    const res = await POST(makeRequest({ followupId: '00000000-0000-0000-0000-000000000001' }, SECRET));
    expect(res.status).toBe(422);
  });

  it('returns 200 when executeSendFollowUp succeeds', async () => {
    mockExecuteSend.mockResolvedValue({ ok: true });
    const res = await POST(makeRequest({ followupId: '00000000-0000-0000-0000-000000000001' }, SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockExecuteSend).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      expect.anything()
    );
  });
});
