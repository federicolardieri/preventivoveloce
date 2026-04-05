import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LIMITS = {
  free: 8,
  starter: 10,
  pro: 20,
} as const;

const limiters = {
  free: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.free, '1 m'), prefix: 'rl:ai:free' }),
  starter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.starter, '1 m'), prefix: 'rl:ai:starter' }),
  pro: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(LIMITS.pro, '1 m'), prefix: 'rl:ai:pro' }),
};

export async function checkAIRateLimit(userId: string, plan: 'free' | 'starter' | 'pro') {
  const limiter = limiters[plan];
  const { success, remaining, reset } = await limiter.limit(userId);
  return { success, remaining, reset, limit: LIMITS[plan] };
}

// ── Rate limiters for other endpoints ──────────────────────────

const emailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:email',
});

const checkEmailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:checkemail',
});

const pdfLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'rl:pdf',
});

const firmaLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'rl:firma',
});

export async function checkEmailRateLimit(userId: string) {
  const { success, remaining, reset } = await emailLimiter.limit(userId);
  return { success, remaining, reset };
}

export async function checkCheckEmailRateLimit(ip: string) {
  const { success, remaining, reset } = await checkEmailLimiter.limit(ip);
  return { success, remaining, reset };
}

export async function checkPDFRateLimit(userId: string) {
  const { success, remaining, reset } = await pdfLimiter.limit(userId);
  return { success, remaining, reset };
}

export async function checkFirmaRateLimit(ip: string) {
  const { success, remaining, reset } = await firmaLimiter.limit(ip);
  return { success, remaining, reset };
}
