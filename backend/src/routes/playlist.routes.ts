import { Router } from 'express';
import { playlistService } from '../services/playlist.service';
import { commentService } from '../services/comment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { ok } from '../utils/respond';
import { parsePagination } from '../utils/pagination';
import {
  addSongSchema,
  createPlaylistSchema,
  reorderSchema,
  updatePlaylistSchema,
} from '../validators';

const router = Router();

/**
 * @openapi
 * /playlists/explore:
 *   get:
 *     tags: [Playlists]
 *     summary: Public feed (trending | new | liked | updated | featured)
 *     security: []
 */
router.get(
  '/explore',
  asyncHandler(async (req, res) => {
    const feed = (req.query.feed as string) || 'trending';
    const { items, meta } = await playlistService.explore(feed, parsePagination(req.query));
    res.json({ data: items, meta });
  }),
);

/**
 * @openapi
 * /playlists:
 *   post: { tags: [Playlists], summary: Create a playlist }
 */
router.post(
  '/',
  requireAuth,
  validate(createPlaylistSchema),
  asyncHandler(async (req, res) => ok(res, await playlistService.create(req.user!.id, req.body), 201)),
);

/**
 * @openapi
 * /playlists/{id}:
 *   get: { tags: [Playlists], summary: Playlist detail (cached), security: [] }
 */
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => ok(res, await playlistService.getById(req.params.id, req.user?.id))),
);

/**
 * @openapi
 * /playlists/{id}:
 *   patch: { tags: [Playlists], summary: Update a playlist }
 */
router.patch(
  '/:id',
  requireAuth,
  validate(updatePlaylistSchema),
  asyncHandler(async (req, res) =>
    ok(res, await playlistService.update(req.params.id, req.user!.id, req.body)),
  ),
);

/**
 * @openapi
 * /playlists/{id}:
 *   delete: { tags: [Playlists], summary: Delete a playlist }
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await playlistService.remove(req.params.id, req.user!.id);
    ok(res, { success: true });
  }),
);

/**
 * @openapi
 * /playlists/{id}/duplicate:
 *   post: { tags: [Playlists], summary: Duplicate a playlist }
 */
router.post(
  '/:id/duplicate',
  requireAuth,
  asyncHandler(async (req, res) =>
    ok(res, await playlistService.duplicate(req.params.id, req.user!.id), 201),
  ),
);

// ── Song management ──────────────────────────────────────────
router.post(
  '/:id/songs',
  requireAuth,
  validate(addSongSchema),
  asyncHandler(async (req, res) => {
    await playlistService.addSong(req.params.id, req.user!.id, req.body.songId);
    ok(res, { success: true }, 201);
  }),
);

router.delete(
  '/:id/songs/:songId',
  requireAuth,
  asyncHandler(async (req, res) => {
    await playlistService.removeSong(req.params.id, req.user!.id, req.params.songId);
    ok(res, { success: true });
  }),
);

/**
 * @openapi
 * /playlists/{id}/reorder:
 *   patch: { tags: [Playlists], summary: Reorder songs (drag & drop) }
 */
router.patch(
  '/:id/reorder',
  requireAuth,
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    await playlistService.reorder(req.params.id, req.user!.id, req.body.songIds);
    ok(res, { success: true });
  }),
);

// ── Comments on a playlist ────────────────────────────────────
router.get(
  '/:id/comments',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { items, meta } = await commentService.list(
      req.params.id,
      req.user?.id,
      parsePagination(req.query),
    );
    res.json({ data: items, meta });
  }),
);

export default router;
