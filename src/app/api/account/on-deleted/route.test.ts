import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────
const mockCleanup = vi.fn();

vi.mock('@/lib/account-cleanup', () => ({
  cleanupUserBilling: (...args: unknown[]) => mockCleanup(...args),
}));

const SECRET = 'test-secret-xyz';
process.env.ACCOUNT_DELETE_WEBHOOK_SECRET = SECRET;

const { POST } = await import('./route');

// ── Helpers ────────────────────────────────────────────────────
function makeRequest(body: unknown, secret?: string): Request {
  return new Request('http://localhost/api/account/on-deleted', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(secret !== undefined ? { 'x-webhook-secret': secret } : {}),
    },
  });
}

// ── Tests ──────────────────────────────────────────────────────
describe('POST /api/account/on-deleted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCleanup.mockReset();
    mockCleanup.mockResolvedValue({ cancelledSubscriptions: 1, hadSubscription: true });
  });

  it('returns 401 when secret header is missing', async () => {
    const res = await POST(makeRequest({ user_id: 'u1', email: 'a@b.it' }));
    expect(res.status).toBe(401);
    expect(mockCleanup).not.toHaveBeenCalled();
  });

  it('returns 401 when secret header is wrong', async () => {
    const res = await POST(makeRequest({ user_id: 'u1' }, 'nope'));
    expect(res.status).toBe(401);
    expect(mockCleanup).not.toHaveBeenCalled();
  });

  it('returns 401 when secret has different length (timing-safe guard)', async () => {
    const res = await POST(makeRequest({ user_id: 'u1' }, 'x'));
    expect(res.status).toBe(401);
    expect(mockCleanup).not.toHaveBeenCalled();
  });

  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/account/on-deleted', {
      method: 'POST',
      body: 'not-json',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': SECRET,
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockCleanup).not.toHaveBeenCalled();
  });

  it('returns 400 when user_id is missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.it' }, SECRET));
    expect(res.status).toBe(400);
    expect(mockCleanup).not.toHaveBeenCalled();
  });

  it('skips cleanup when billing_cleanup_done flag is true', async () => {
    const res = await POST(
      makeRequest(
        { user_id: 'u1', email: 'a@b.it', stripe_customer_id: 'cus_1', billing_cleanup_done: true },
        SECRET
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skipped).toBe(true);
    expect(mockCleanup).not.toHaveBeenCalled();
  });

  it('invokes cleanupUserBilling with payload fields', async () => {
    const res = await POST(
      makeRequest(
        { user_id: 'u1', email: 'a@b.it', stripe_customer_id: 'cus_1' },
        SECRET
      )
    );
    expect(res.status).toBe(200);
    expect(mockCleanup).toHaveBeenCalledWith({
      email: 'a@b.it',
      stripeCustomerId: 'cus_1',
    });
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.cancelledSubscriptions).toBe(1);
  });

  it('forwards null email and customer when not in payload', async () => {
    const res = await POST(makeRequest({ user_id: 'u1' }, SECRET));
    expect(res.status).toBe(200);
    expect(mockCleanup).toHaveBeenCalledWith({
      email: null,
      stripeCustomerId: null,
    });
  });
});
