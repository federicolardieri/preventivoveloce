import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
  }),
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { plan: 'pro', credits_remaining: null, credits_reset_at: null, plan_expires_at: null },
            error: null,
          }),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

vi.mock('@/lib/ratelimit', () => ({
  checkPDFRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/quota', () => ({
  checkQuota: vi.fn().mockResolvedValue({
    allowed: true,
    plan: 'pro',
    creditsRemaining: null,
    creditsTotal: null,
    isExistingQuote: false,
    planExpiresAt: null,
  }),
}));

vi.mock('@/pdf/generatePDF', () => ({
  generatePDF: vi.fn().mockImplementation(async () =>
    (async function* () {
      yield Buffer.from('%PDF-1.4 fake pdf content');
    })()
  ),
}));

const { POST } = await import('./route');

// ── Helpers ────────────────────────────────────────────────────
function makeQuoteBody(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quote-1',
    number: 'PRV-001',
    status: 'bozza',
    currency: 'EUR',
    template: 'classic',
    theme: {
      primaryColor: '#5c32e6',
      accentColor: '#1d4ed8',
      textColor: '#1e293b',
      fontFamily: 'Helvetica',
      tableStyle: 'striped',
      logoPosition: 'left',
      showFooterNotes: true,
      showPaymentTerms: true,
    },
    sender: { name: 'Test Sender', address: '', city: '', postalCode: '', country: '', vatNumber: '', email: '', phone: '' },
    client: { name: 'Test Client', address: '', city: '', postalCode: '', country: '', vatNumber: '', email: '', phone: '' },
    items: [{ id: 'item-1', description: 'Servizio', quantity: 1, unitPrice: 100, discount: 0, vatRate: 22 }],
    notes: '',
    paymentTerms: '',
    validityDays: 30,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/pdf', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Tests ──────────────────────────────────────────────────────
describe('POST /api/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated users', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);

    const res = await POST(makeRequest(makeQuoteBody()));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    const { checkPDFRateLimit } = await import('@/lib/ratelimit');
    vi.mocked(checkPDFRateLimit).mockResolvedValueOnce({ success: false } as never);

    const res = await POST(makeRequest(makeQuoteBody()));
    expect(res.status).toBe(429);
  });

  it('returns 400 for oversized attachments', async () => {
    // 3MB base64 string (over 2MB limit per file)
    const bigData = 'data:application/pdf;base64,' + 'A'.repeat(3 * 1024 * 1024);
    const body = makeQuoteBody({
      attachments: [{ id: 'att-1', name: 'big.pdf', type: 'application/pdf', data: bigData }],
    });

    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('troppo grande');
  });

  it('generates PDF successfully for valid request', async () => {
    const res = await POST(makeRequest(makeQuoteBody()));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('does not inject default logo when hideLogo is true', async () => {
    const { generatePDF } = await import('@/pdf/generatePDF');

    const body = makeQuoteBody({
      theme: {
        primaryColor: '#5c32e6',
        accentColor: '#1d4ed8',
        textColor: '#1e293b',
        fontFamily: 'Helvetica',
        tableStyle: 'striped',
        logoPosition: 'left',
        showFooterNotes: true,
        showPaymentTerms: true,
        hideLogo: true,
      },
      sender: {
        name: 'Test',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        vatNumber: '',
        email: '',
        phone: '',
        // no logo property
      },
    });

    const res = await POST(makeRequest(body));
    expect(res.status).toBe(200);

    const calls = vi.mocked(generatePDF).mock.calls;
    const lastCall = calls[calls.length - 1];
    const quote = lastCall[0];
    expect(quote.sender.logo).toBeUndefined();
  });
});
