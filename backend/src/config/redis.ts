import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: false,
});

redis.on('error', (err) => {
  // Don't crash the process on transient Redis errors — caching is best-effort.
  console.error('[redis] connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[redis] connected');
});

/**
 * Cache-aside helper. Returns cached JSON if present, otherwise runs the
 * loader, stores the result with a TTL, and returns it. Fails open: if Redis
 * is unavailable the loader still runs.
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    // ignore — fall through to loader
  }

  const fresh = await loader();

  try {
    await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  } catch {
    // ignore write failures
  }

  return fresh;
}

/** Invalidate one or more keys / glob patterns. Best-effort. */
export async function invalidate(patterns: string[]): Promise<void> {
  try {
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const keys = await redis.keys(pattern);
        if (keys.length) await redis.del(...keys);
      } else {
        await redis.del(pattern);
      }
    }
  } catch {
    // ignore
  }
}

export const cacheKeys = {
  dashboard: (userId: string) => `dashboard:${userId}`,
  playlist: (id: string) => `playlist:${id}`,
  explore: (feed: string, page: number) => `explore:${feed}:${page}`,
  trending: 'trending:playlists',
  search: (q: string, type: string) => `search:${type}:${q.toLowerCase()}`,
  session: (userId: string, tokenId: string) => `session:${userId}:${tokenId}`,
};
