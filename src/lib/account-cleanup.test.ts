import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────
const mockList = vi.fn();
const mockCancel = vi.fn();
const mockSendEmail = vi.fn();

vi.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      list: (...args: unknown[]) => mockList(...args),
      cancel: (...args: unknown[]) => mockCancel(...args),
    },
  },
}));

vi.mock('@/lib/email', () => ({
  sendAccountDeletedEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

const { cleanupUserBilling } = await import('./account-cleanup');

// ── Tests ──────────────────────────────────────────────────────
describe('cleanupUserBilling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockReset();
    mockCancel.mockReset();
    mockSendEmail.mockReset();
  });

  it('skips Stripe when no customer id, still sends email', async () => {
    mockSendEmail.mockResolvedValue(undefined);

    const result = await cleanupUserBilling({
      email: 'a@b.it',
      stripeCustomerId: null,
    });

    expect(mockList).not.toHaveBeenCalled();
    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith({ to: 'a@b.it', hadSubscription: false });
    expect(result).toEqual({ cancelledSubscriptions: 0, hadSubscription: false });
  });

  it('skips email when no address, still cancels Stripe subs', async () => {
    mockList.mockResolvedValue({
      data: [{ id: 'sub_1', status: 'active' }],
    });
    mockCancel.mockResolvedValue({});

    const result = await cleanupUserBilling({
      email: null,
      stripeCustomerId: 'cus_123',
    });

    expect(mockCancel).toHaveBeenCalledWith('sub_1', { invoice_now: false, prorate: false });
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(result).toEqual({ cancelledSubscriptions: 1, hadSubscription: true });
  });

  it('cancels only non-terminal subscriptions and reports count', async () => {
    mockList.mockResolvedValue({
      data: [
        { id: 'sub_active', status: 'active' },
        { id: 'sub_pastdue', status: 'past_due' },
        { id: 'sub_canceled', status: 'canceled' },
        { id: 'sub_expired', status: 'incomplete_expired' },
      ],
    });
    mockCancel.mockResolvedValue({});
    mockSendEmail.mockResolvedValue(undefined);

    const result = await cleanupUserBilling({
      email: 'a@b.it',
      stripeCustomerId: 'cus_123',
    });

    expect(mockCancel).toHaveBeenCalledTimes(2);
    expect(mockCancel).toHaveBeenCalledWith('sub_active', expect.anything());
    expect(mockCancel).toHaveBeenCalledWith('sub_pastdue', expect.anything());
    expect(mockSendEmail).toHaveBeenCalledWith({ to: 'a@b.it', hadSubscription: true });
    expect(result.cancelledSubscriptions).toBe(2);
    expect(result.hadSubscription).toBe(true);
  });

  it('passes hadSubscription=false when customer has only terminal subs', async () => {
    mockList.mockResolvedValue({
      data: [
        { id: 'sub_canceled', status: 'canceled' },
        { id: 'sub_expired', status: 'incomplete_expired' },
      ],
    });
    mockSendEmail.mockResolvedValue(undefined);

    await cleanupUserBilling({ email: 'a@b.it', stripeCustomerId: 'cus_123' });

    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith({ to: 'a@b.it', hadSubscription: false });
  });

  it('swallows Stripe list errors and still sends email', async () => {
    mockList.mockRejectedValue(new Error('stripe down'));
    mockSendEmail.mockResolvedValue(undefined);

    const result = await cleanupUserBilling({
      email: 'a@b.it',
      stripeCustomerId: 'cus_123',
    });

    expect(mockSendEmail).toHaveBeenCalledWith({ to: 'a@b.it', hadSubscription: false });
    expect(result.cancelledSubscriptions).toBe(0);
  });

  it('swallows single-subscription cancel errors and continues with the rest', async () => {
    mockList.mockResolvedValue({
      data: [
        { id: 'sub_broken', status: 'active' },
        { id: 'sub_ok', status: 'active' },
      ],
    });
    mockCancel
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({});
    mockSendEmail.mockResolvedValue(undefined);

    const result = await cleanupUserBilling({
      email: 'a@b.it',
      stripeCustomerId: 'cus_123',
    });

    expect(mockCancel).toHaveBeenCalledTimes(2);
    expect(result.cancelledSubscriptions).toBe(1);
    expect(result.hadSubscription).toBe(true);
  });

  it('swallows email errors so the cleanup never throws', async () => {
    mockList.mockResolvedValue({ data: [] });
    mockSendEmail.mockRejectedValue(new Error('resend 500'));

    await expect(
      cleanupUserBilling({ email: 'a@b.it', stripeCustomerId: 'cus_123' })
    ).resolves.toBeDefined();
  });
});
