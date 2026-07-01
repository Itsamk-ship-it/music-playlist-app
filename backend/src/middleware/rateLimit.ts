import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';

// Redis-backed store so limits are shared across backend instances.
function store(prefix: string) {
  return new RedisStore({
    prefix: `rl:${prefix}:`,
    // ioredis command adapter
    sendCommand: (command: string, ...args: string[]) =>
      redis.call(command, ...args) as Promise<never>,
  });
}

/** Generous global limiter applied to every /api route. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: store('global'),
  message: { error: { message: 'Too many requests, please slow down.' } },
});

/** Strict limiter for auth endpoints to blunt brute-force attempts. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: store('auth'),
  message: { error: { message: 'Too many auth attempts, please try again later.' } },
});

/** Moderate limiter for search to protect the DB/cache. */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: store('search'),
  message: { error: { message: 'Too many searches, please try again shortly.' } },
});
