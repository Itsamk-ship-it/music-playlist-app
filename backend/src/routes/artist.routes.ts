import { Router } from 'express';
import { catalogService } from '../services/catalog.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/respond';
import { parsePagination } from '../utils/pagination';

const router = Router();

/**
 * @openapi
 * /artists:
 *   get: { tags: [Artists], summary: List / search artists, security: [] }
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { items, meta } = await catalogService.listArtists(
      req.query.q as string | undefined,
      parsePagination(req.query),
    );
    res.json({ data: items, meta });
  }),
);

/**
 * @openapi
 * /artists/{id}:
 *   get: { tags: [Artists], summary: Artist detail with albums + top songs, security: [] }
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await catalogService.getArtist(req.params.id))),
);

export default router;
