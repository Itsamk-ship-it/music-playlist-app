import { Router } from 'express';
import { favoriteService } from '../services/favorite.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/respond';
import { parsePagination } from '../utils/pagination';
import { favoriteSchema } from '../validators';

const router = Router();

/**
 * @openapi
 * /favorites/toggle:
 *   post: { tags: [Favorites], summary: Favorite / unfavorite a song or playlist }
 */
router.post(
  '/toggle',
  requireAuth,
  validate(favoriteSchema),
  asyncHandler(async (req, res) =>
    ok(res, await favoriteService.toggle(req.user!.id, req.body.target, req.body.id)),
  ),
);

/**
 * @openapi
 * /favorites/songs:
 *   get: { tags: [Favorites], summary: Current user's favorite songs }
 */
router.get(
  '/songs',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { items, meta } = await favoriteService.listSongs(req.user!.id, parsePagination(req.query));
    res.json({ data: items, meta });
  }),
);

/**
 * @openapi
 * /favorites/playlists:
 *   get: { tags: [Favorites], summary: Current user's favorite playlists }
 */
router.get(
  '/playlists',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { items, meta } = await favoriteService.listPlaylists(req.user!.id, parsePagination(req.query));
    res.json({ data: items, meta });
  }),
);

export default router;
