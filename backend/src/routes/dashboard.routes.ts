import { Router } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { ok } from '../utils/respond';

const router = Router();

/**
 * @openapi
 * /dashboard:
 *   get: { tags: [Dashboard], summary: Aggregated stats + recent activity (cached) }
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => ok(res, await dashboardService.get(req.user!.id))),
);

export default router;
