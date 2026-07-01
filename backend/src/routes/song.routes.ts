import { Router } from 'express';
import { songService } from '../services/song.service';
import { asyncHandler } from '../utils/asyncHandler';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { ok } from '../utils/respond';
import { parsePagination } from '../utils/pagination';

const router = Router();

/**
 * @openapi
 * /songs:
 *   get:
 *     tags: [Songs]
 *     summary: List / search songs
 *     security: []
 *     parameters:
 *       - { in: query, name: q, schema: { type: string } }
 *       - { in: query, name: genre, schema: { type: string } }
 *       - { in: query, name: sort, schema: { type: string, enum: [title, newest, popular] } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { items, meta } = await songService.list(
      { q: req.query.q as string, genre: req.query.genre as string, sort: req.query.sort as string },
      parsePagination(req.query),
    );
    res.json({ data: items, meta });
  }),
);

/**
 * @openapi
 * /songs/{id}:
 *   get: { tags: [Songs], summary: Song details, security: [] }
 */
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => ok(res, await songService.getById(req.params.id, req.user?.id))),
);

/**
 * @openapi
 * /songs/{id}/play:
 *   post: { tags: [Songs], summary: Record a play in recently-played history }
 */
router.post(
  '/:id/play',
  requireAuth,
  asyncHandler(async (req, res) => {
    await songService.recordPlay(req.user!.id, req.params.id);
    ok(res, { success: true });
  }),
);

export default router;
