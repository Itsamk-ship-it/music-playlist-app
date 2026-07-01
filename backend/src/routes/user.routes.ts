import { Router } from 'express';
import { userService } from '../services/user.service';
import { playlistService } from '../services/playlist.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { ok } from '../utils/respond';
import { parsePagination } from '../utils/pagination';
import { updateProfileSchema } from '../validators';

const router = Router();

/**
 * @openapi
 * /users/me:
 *   get: { tags: [Users], summary: Current user profile }
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => ok(res, await userService.me(req.user!.id))),
);

/**
 * @openapi
 * /users/me:
 *   patch: { tags: [Users], summary: Update current user profile }
 */
router.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => ok(res, await userService.updateProfile(req.user!.id, req.body))),
);

/**
 * @openapi
 * /users/{username}:
 *   get: { tags: [Users], summary: Public profile by username, security: [] }
 */
router.get(
  '/:username',
  optionalAuth,
  asyncHandler(async (req, res) =>
    ok(res, await userService.getByUsername(req.params.username, req.user?.id)),
  ),
);

/**
 * @openapi
 * /users/{username}/playlists:
 *   get: { tags: [Users], summary: A user's playlists, security: [] }
 */
router.get(
  '/:username/playlists',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const profile = await userService.getByUsername(req.params.username, req.user?.id);
    const { items, meta } = await playlistService.listByOwner(
      profile.id,
      req.user?.id,
      parsePagination(req.query),
    );
    res.json({ data: items, meta });
  }),
);

/**
 * @openapi
 * /users/{username}/follow:
 *   post: { tags: [Users], summary: Follow / unfollow a user }
 */
router.post(
  '/:username/follow',
  requireAuth,
  asyncHandler(async (req, res) =>
    ok(res, await userService.toggleFollow(req.user!.id, req.params.username)),
  ),
);

export default router;
