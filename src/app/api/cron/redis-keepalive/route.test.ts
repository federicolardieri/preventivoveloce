import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockPing = vi.fn();
const mockLogError = vi.fn();

vi.mock('@/lib/ratelimit', () => ({
  pingRedis: () => mockPing(),
}));
vi.mock('@/lib/logger', () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}));

const SECRET = 'cron-secret-xyz';
process.env.CRON_SECRET = SECRET;

const { GET } = await import('./route');

function makeRequest(auth?: string): NextRequest {
  return new NextRequest('http://localhost/api/cron/redis-keepalive', {
    headers: auth !== undefined ? { authorization: auth } : {},
  });
}

describe('GET /api/cron/redis-keepalive', () => {
  beforeEach(() => {
    mockPing.mockReset();
    mockLogError.mockReset();
    mockPing.mockResolvedValue('PONG');
  });

  it('returns 401 without authorization header', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(mockPing).not.toHaveBeenCalled();
  });

  it('returns 401 with wrong secret', async () => {
    const res = await GET(makeRequest('Bearer nope'));
    expect(res.status).toBe(401);
    expect(mockPing).not.toHaveBeenCalled();
  });

  it('pings Redis with the correct secret', async () => {
    const res = await GET(makeRequest(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, result: 'PONG' });
    expect(mockPing).toHaveBeenCalledOnce();
  });

  it('returns 503 and logs when Redis is unreachable', async () => {
    mockPing.mockRejectedValue(new Error('ENOTFOUND'));
    const res = await GET(makeRequest(`Bearer ${SECRET}`));
    expect(res.status).toBe(503);
    expect(mockLogError).toHaveBeenCalledWith('cron.redis-keepalive', expect.any(Error));
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeRequest(`Bearer ${SECRET}`));
    expect(res.status).toBe(500);
    process.env.CRON_SECRET = SECRET;
  });
});
