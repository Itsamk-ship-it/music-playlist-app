import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { redis, cacheKeys } from '../config/redis';
import { AppError } from '../utils/errors';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { env } from '../config/env';
import { z } from 'zod';
import { loginSchema, registerSchema } from '../validators';

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

function publicUser(user: {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  favoriteGenre: string | null;
  isPublic: boolean;
}) {
  return user;
}

async function issueTokens(user: { id: string; role: string; username: string }, meta: { userAgent?: string; ip?: string }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, username: user.username });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: 'pending',
      userAgent: meta.userAgent,
      ip: meta.ip,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    },
  });

  const refreshToken = signRefreshToken({ sub: user.id, tokenId: session.id });
  await prisma.session.update({ where: { id: session.id }, data: { refreshToken } });

  // Mirror the session in Redis for fast validation / revocation.
  await redis
    .set(cacheKeys.session(user.id, session.id), refreshToken, 'EX', REFRESH_TTL_SECONDS)
    .catch(() => undefined);

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: z.infer<typeof registerSchema>, meta: { userAgent?: string; ip?: string }) {
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
      select: { email: true, username: true },
    });
    if (exists) {
      const field = exists.email === input.email ? 'Email' : 'Username';
      throw AppError.conflict(`${field} is already taken`);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        name: input.name,
        passwordHash,
      },
    });

    const tokens = await issueTokens(user, meta);
    return { user: publicUser(user), ...tokens };
  },

  async login(input: z.infer<typeof loginSchema>, meta: { userAgent?: string; ip?: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw AppError.unauthorized('Invalid credentials');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw AppError.unauthorized('Invalid credentials');

    const tokens = await issueTokens(user, meta);
    return { user: publicUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) throw AppError.unauthorized('Missing refresh token');

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // Validate against Redis first (fast path), then DB.
    const cached = await redis.get(cacheKeys.session(payload.sub, payload.tokenId)).catch(() => null);
    const session =
      cached === refreshToken
        ? { userId: payload.sub }
        : await prisma.session.findUnique({ where: { id: payload.tokenId } });

    if (!session || (cached !== refreshToken && (session as { refreshToken?: string }).refreshToken !== refreshToken)) {
      throw AppError.unauthorized('Session expired or revoked');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw AppError.unauthorized('User no longer exists');

    const accessToken = signAccessToken({ sub: user.id, role: user.role, username: user.username });
    return { accessToken, user: publicUser(user) };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.session.deleteMany({ where: { id: payload.tokenId } });
      await redis.del(cacheKeys.session(payload.sub, payload.tokenId)).catch(() => undefined);
    } catch {
      // token already invalid — nothing to do
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw AppError.badRequest('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Revoke all sessions on password change.
    await prisma.session.deleteMany({ where: { userId } });
    const keys = await redis.keys(cacheKeys.session(userId, '*')).catch(() => []);
    if (keys.length) await redis.del(...keys).catch(() => undefined);
  },

  cookieOptions() {
    return {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax' as const,
      maxAge: REFRESH_TTL_SECONDS * 1000,
      path: '/api/auth',
    };
  },
};
