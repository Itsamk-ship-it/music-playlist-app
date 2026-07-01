import { Router } from 'express';
import { likeService } from '../services/like.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/respond';
import { likeSchema } from '../validators';

const router = Router();

/**
 * @openapi
 * /likes/toggle:
 *   post:
 *     tags: [Likes]
 *     summary: Like / unlike a song, playlist or comment
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target: { type: string, enum: [SONG, PLAYLIST, COMMENT] }
 *               id: { type: string }
 */
router.post(
  '/toggle',
  requireAuth,
  validate(likeSchema),
  asyncHandler(async (req, res) =>
    ok(res, await likeService.toggle(req.user!.id, req.body.target, req.body.id)),
  ),
);

export default router;
