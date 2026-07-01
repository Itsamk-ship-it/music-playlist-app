import { Router } from 'express';
import { catalogService } from '../services/catalog.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/respond';
import { parsePagination } from '../utils/pagination';

const router = Router();

/**
 * @openapi
 * /albums:
 *   get: { tags: [Albums], summary: List / search albums, security: [] }
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { items, meta } = await catalogService.listAlbums(
      req.query.q as string | undefined,
      parsePagination(req.query),
    );
    res.json({ data: items, meta });
  }),
);

/**
 * @openapi
 * /albums/{id}:
 *   get: { tags: [Albums], summary: Album detail with track list, security: [] }
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await catalogService.getAlbum(req.params.id))),
);

export default router;
