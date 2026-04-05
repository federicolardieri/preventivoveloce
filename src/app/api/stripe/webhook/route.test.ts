import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────
const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
const mockGetUserById = vi.fn().mockResolvedValue({ data: { user: { email: 'test@test.com' } } });

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    rpc: mockRpc,
    from: (table: string) => {
      if (table === 'subscriptions') {
        return { upsert: mockUpsert, update: mockUpdate };
      }
      return {};
    },
    auth: { admin: { getUserById: mockGetUserById } },
  }),
}));

const mockConstructEvent = vi.fn();
const mockRetrieveSubscription = vi.fn();

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockRetrieveSubscription },
  },
}));

vi.mock('@/lib/email', () => ({
  sendSubscriptionConfirmation: vi.fn().mockResolvedValue(undefined),
}));

// ── Import route after mocks ──────────────────────────────────
const { POST } = await import('./route');

// ── Helpers ────────────────────────────────────────────────────
function makeRequest(body: string, sig = 'valid-sig') {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': sig },
  });
}

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_123',
    status: 'active',
    metadata: { user_id: 'user-uuid-123' },
    cancel_at_period_end: false,
    items: {
      data: [{
        price: { id: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_m', product: 'prod_123' },
        current_period_start: 1700000000,
        current_period_end: 1702592000,
      }],
    },
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────
describe('Stripe Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if stripe-signature header is missing', async () => {
    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Firma mancante');
  });

  it('returns 400 if signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Firma webhook non valida');
  });

  it('activates plan on checkout.session.completed with active subscription', async () => {
    const subscription = makeSubscription({ status: 'active' });

    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          subscription: 'sub_123',
          metadata: { user_id: 'user-uuid-123' },
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue(subscription);

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    // activate_plan should be called
    expect(mockRpc).toHaveBeenCalledWith('activate_plan', expect.objectContaining({
      p_user_id: 'user-uuid-123',
      p_plan: expect.any(String),
    }));

    // subscription upsert should be called
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('does NOT activate plan if subscription is incomplete', async () => {
    const subscription = makeSubscription({ status: 'incomplete' });

    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          subscription: 'sub_123',
          metadata: { user_id: 'user-uuid-123' },
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue(subscription);

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    // activate_plan should NOT be called for incomplete subscriptions
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('downgrades to free on subscription.deleted', async () => {
    const subscription = makeSubscription({ status: 'canceled' });

    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: subscription },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);

    expect(mockRpc).toHaveBeenCalledWith('activate_plan', {
      p_user_id: 'user-uuid-123',
      p_plan: 'free',
      p_duration_days: 0,
    });
  });

  it('marks subscription as past_due on invoice.payment_failed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          parent: {
            subscription_details: { subscription: 'sub_123' },
          },
        },
      },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });
});
