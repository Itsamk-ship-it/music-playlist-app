import { Router } from 'express';
import { notificationService } from '../services/notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/respond';
import { parsePagination } from '../utils/pagination';

const router = Router();
router.use(requireAuth);

/**
 * @openapi
 * /notifications:
 *   get: { tags: [Notifications], summary: List notifications (with unread count) }
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { items, meta } = await notificationService.list(req.user!.id, parsePagination(req.query));
    res.json({ data: items, meta });
  }),
);

/**
 * @openapi
 * /notifications/read-all:
 *   post: { tags: [Notifications], summary: Mark all as read }
 */
router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user!.id);
    ok(res, { success: true });
  }),
);

/**
 * @openapi
 * /notifications/{id}/read:
 *   post: { tags: [Notifications], summary: Mark one as read }
 */
router.post(
  '/:id/read',
  asyncHandler(async (req, res) => ok(res, await notificationService.markRead(req.user!.id, req.params.id))),
);

export default router;
