import { Router } from 'express';
import { commentService } from '../services/comment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/respond';
import { createCommentSchema, updateCommentSchema } from '../validators';

const router = Router();

/**
 * @openapi
 * /comments:
 *   post: { tags: [Comments], summary: Add a comment to a playlist }
 */
router.post(
  '/',
  requireAuth,
  validate(createCommentSchema),
  asyncHandler(async (req, res) =>
    ok(res, await commentService.create(req.user!.id, req.body.playlistId, req.body.body), 201),
  ),
);

/**
 * @openapi
 * /comments/{id}:
 *   patch: { tags: [Comments], summary: Edit your comment }
 */
router.patch(
  '/:id',
  requireAuth,
  validate(updateCommentSchema),
  asyncHandler(async (req, res) =>
    ok(res, await commentService.update(req.user!.id, req.params.id, req.body.body)),
  ),
);

/**
 * @openapi
 * /comments/{id}:
 *   delete: { tags: [Comments], summary: Delete a comment }
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    await commentService.remove(req.user!.id, req.user!.role, req.params.id);
    ok(res, { success: true });
  }),
);

export default router;
