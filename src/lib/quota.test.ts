import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────
const mockGetUser = vi.fn();
const mockAdminFrom = vi.fn();
const mockAdminRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
  createAdminClient: () => ({
    from: mockAdminFrom,
    rpc: mockAdminRpc,
  }),
}));

const { checkQuota } = await import('./quota');

// ── Helpers ────────────────────────────────────────────────────
function mockProfile(profile: Record<string, unknown>) {
  mockAdminFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: profile, error: null }),
          }),
        }),
      };
    }
    if (table === 'quotes') {
      return {
        select: () => ({
          eq: vi.fn().mockReturnValue({
            eq: () => Promise.resolve({ count: 0, error: null }),
          }),
        }),
      };
    }
    return {};
  });
}

// ── Tests ──────────────────────────────────────────────────────
describe('checkQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns not allowed for unauthenticated users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await checkQuota('quote-123');
    expect(result.allowed).toBe(false);
    expect(result.plan).toBe('free');
    expect(result.message).toContain('non autenticato');
  });

  it('allows pro users with unlimited credits', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockProfile({
      plan: 'pro',
      credits_remaining: null,
      credits_reset_at: null,
      plan_expires_at: new Date(Date.now() + 86400000).toISOString(), // domani
    });

    const result = await checkQuota('');
    expect(result.allowed).toBe(true);
    expect(result.plan).toBe('pro');
    expect(result.creditsRemaining).toBeNull();
  });

  it('allows free users with credits remaining', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockProfile({
      plan: 'free',
      credits_remaining: 1,
      credits_reset_at: null,
      plan_expires_at: null,
    });

    const result = await checkQuota('');
    expect(result.allowed).toBe(true);
    expect(result.plan).toBe('free');
    expect(result.creditsRemaining).toBe(1);
  });

  it('blocks free users with no credits', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockProfile({
      plan: 'free',
      credits_remaining: 0,
      credits_reset_at: null,
      plan_expires_at: null,
    });

    const result = await checkQuota('');
    expect(result.allowed).toBe(false);
    expect(result.plan).toBe('free');
    expect(result.message).toContain('Free');
  });

  it('downgrades expired starter plan to free', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    // Profile has expired starter plan
    const expiredDate = new Date(Date.now() - 86400000).toISOString(); // ieri
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: {
                  plan: 'starter',
                  credits_remaining: 5,
                  credits_reset_at: null,
                  plan_expires_at: expiredDate,
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ data: null, error: null }),
          }),
        };
      }
      if (table === 'quotes') {
        return {
          select: () => ({
            eq: vi.fn().mockReturnValue({
              eq: () => Promise.resolve({ count: 0, error: null }),
            }),
            // count query for total quotes
          }),
        };
      }
      return {};
    });

    const result = await checkQuota('');
    expect(result.plan).toBe('free');
  });

  it('blocks starter users with no credits left', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockProfile({
      plan: 'starter',
      credits_remaining: 0,
      credits_reset_at: new Date().toISOString(),
      plan_expires_at: new Date(Date.now() + 86400000 * 15).toISOString(), // 15 giorni
    });

    const result = await checkQuota('');
    expect(result.allowed).toBe(false);
    expect(result.plan).toBe('starter');
    expect(result.message).toContain('esaurito');
  });
});
