import { Router } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { ok } from '../utils/respond';
import { changePasswordSchema, loginSchema, registerSchema } from '../validators';

const router = Router();
router.use(authLimiter);

const meta = (req: import('express').Request) => ({
  userAgent: req.headers['user-agent'],
  ip: req.ip,
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     responses:
 *       201: { description: Created — returns user + accessToken }
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, meta(req));
    res.cookie('refreshToken', result.refreshToken, authService.cookieOptions());
    ok(res, { user: result.user, accessToken: result.accessToken }, 201);
  }),
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email + password
 *     security: []
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, meta(req));
    res.cookie('refreshToken', result.refreshToken, authService.cookieOptions());
    ok(res, { user: result.user, accessToken: result.accessToken });
  }),
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange refresh token cookie for a new access token
 *     security: []
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken ?? req.body?.refreshToken;
    const result = await authService.refresh(token);
    ok(res, result);
  }),
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current session
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await authService.logout(req.cookies?.refreshToken);
    res.clearCookie('refreshToken', authService.cookieOptions());
    ok(res, { success: true });
  }),
);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the current user's password
 */
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    res.clearCookie('refreshToken', authService.cookieOptions());
    ok(res, { success: true });
  }),
);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset (stubbed — no email service in local setup)
 *     security: []
 */
router.post(
  '/forgot-password',
  asyncHandler(async (_req, res) => {
    // UI-only per spec: always return success to avoid user enumeration.
    ok(res, { success: true, message: 'If that email exists, a reset link has been sent.' });
  }),
);

export default router;
