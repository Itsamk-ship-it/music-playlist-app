import { Router } from 'express';
import { createHash } from 'crypto';
import { hostname } from 'os';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * Short, non-reversible fingerprint of a secret. Lets you detect whether a
 * value CHANGED across deployments without ever exposing the value itself.
 */
function fingerprint(value?: string | null): string | null {
  if (!value) return null;
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

/**
 * Safely break down the connection string the app is actually using.
 * Never returns the raw password — only its fingerprint.
 */
function describeDatabaseUrl(raw?: string) {
  if (!raw) return { present: false as const };
  try {
    const u = new URL(raw);
    return {
      present: true as const,
      protocol: u.protocol.replace(':', ''),
      user: decodeURIComponent(u.username) || null,
      host: u.hostname || null,
      port: u.port || null,
      database: u.pathname.replace(/^\//, '') || null,
      passwordFingerprint: fingerprint(u.password || null),
    };
  } catch {
    // Unparseable — still fingerprint the whole thing so changes are detectable.
    return { present: true as const, parseError: true, rawFingerprint: fingerprint(raw) };
  }
}

/**
 * @openapi
 * /diag:
 *   get:
 *     tags: [Health]
 *     summary: Deployment diagnostics — env, DB credentials fingerprint, connectivity
 *     description: >
 *       Read-only. Exposes the credential SET the app is using (user/host/db plus a
 *       SHA-256 fingerprint of the password — never the password itself) and confirms
 *       DB + Redis connectivity. Use it to compare credentials across deployments.
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [dbPing, cachePing, dbTime] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      redis.ping(),
      prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`,
    ]);

    res.json({
      status: 'ok',
      // Which instance / build you're hitting — confirms a redeploy actually rolled.
      instance: {
        hostname: hostname(),
        nodeEnv: process.env.NODE_ENV ?? null,
        uptimeSeconds: Math.round(process.uptime()),
        startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      },
      // The credentials the APP pod uses to reach the database.
      database: {
        connectionString: describeDatabaseUrl(process.env.DATABASE_URL),
        // Present only if the app pod itself carries these (the db pod usually does).
        POSTGRES_USER: process.env.POSTGRES_USER ?? null,
        POSTGRES_DB: process.env.POSTGRES_DB ?? null,
        POSTGRES_PASSWORD_fingerprint: fingerprint(process.env.POSTGRES_PASSWORD),
      },
      // Live connectivity — replaces a separate /db-test.
      connectivity: {
        database: dbPing.status === 'fulfilled' ? 'up' : 'down',
        redis: cachePing.status === 'fulfilled' ? 'up' : 'down',
        databaseTime:
          dbTime.status === 'fulfilled' ? dbTime.value?.[0]?.now ?? null : null,
        databaseError:
          dbPing.status === 'rejected' ? String(dbPing.reason?.message ?? dbPing.reason) : null,
      },
    });
  }),
);

export default router;
