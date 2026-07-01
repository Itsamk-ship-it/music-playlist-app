import { Router } from 'express';
import { searchService } from '../services/search.service';
import { catalogService } from '../services/catalog.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { searchLimiter } from '../middleware/rateLimit';
import { ok } from '../utils/respond';
import { searchQuery } from '../validators';

const router = Router();

/**
 * @openapi
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Global search across songs, artists, albums, playlists, users
 *     security: []
 *     parameters:
 *       - { in: query, name: q, required: true, schema: { type: string } }
 *       - { in: query, name: type, schema: { type: string, enum: [all, songs, artists, albums, playlists, users] } }
 */
router.get(
  '/',
  searchLimiter,
  validate(searchQuery, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.query.q as string;
    const type = (req.query.type as string) || 'all';
    ok(res, await searchService.search(q, type as never));
  }),
);

/**
 * @openapi
 * /search/genres:
 *   get: { tags: [Search], summary: All genres/categories, security: [] }
 */
router.get(
  '/genres',
  asyncHandler(async (_req, res) => ok(res, await catalogService.listGenres())),
);

export default router;
