import { Router } from 'express';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Liveness + dependency check
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [db, cache] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      redis.ping(),
    ]);
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      services: {
        database: db.status === 'fulfilled' ? 'up' : 'down',
        redis: cache.status === 'fulfilled' ? 'up' : 'down',
      },
    });
  }),
);

export default router;
