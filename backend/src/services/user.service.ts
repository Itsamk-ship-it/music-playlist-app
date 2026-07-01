import { prisma } from '../config/prisma';
import { invalidate, cacheKeys } from '../config/redis';
import { AppError } from '../utils/errors';
import { notificationService } from './notification.service';

const publicSelect = {
  id: true,
  username: true,
  name: true,
  bio: true,
  avatarUrl: true,
  favoriteGenre: true,
  isPublic: true,
  createdAt: true,
  _count: { select: { playlists: true, followers: true, following: true } },
};

export const userService = {
  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatarUrl: true,
        favoriteGenre: true,
        isPublic: true,
        role: true,
        createdAt: true,
        _count: { select: { playlists: true, followers: true, following: true } },
      },
    });
    if (!user) throw AppError.notFound('User not found');

    const likeCount = await prisma.like.count({ where: { playlist: { ownerId: userId } } });
    return { ...user, likeCount };
  },

  async getByUsername(username: string, viewerId?: string) {
    const user = await prisma.user.findUnique({ where: { username }, select: publicSelect });
    if (!user) throw AppError.notFound('User not found');
    if (!user.isPublic && user.id !== viewerId) {
      throw AppError.forbidden('This profile is private');
    }

    const [likeCount, isFollowing] = await Promise.all([
      prisma.like.count({ where: { playlist: { ownerId: user.id } } }),
      viewerId
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
          })
        : null,
    ]);

    return { ...user, likeCount, isFollowing: !!isFollowing };
  },

  async updateProfile(
    userId: string,
    input: Partial<{
      name: string;
      bio: string | null;
      avatarUrl: string | null;
      favoriteGenre: string | null;
      isPublic: boolean;
    }>,
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: publicSelect,
    });
    await invalidate([cacheKeys.dashboard(userId)]);
    return user;
  },

  async toggleFollow(followerId: string, username: string) {
    const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!target) throw AppError.notFound('User not found');
    if (target.id === followerId) throw AppError.badRequest('You cannot follow yourself');

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return { following: false };
    }
    await prisma.follow.create({ data: { followerId, followingId: target.id } });
    void notificationService.create({
      userId: target.id,
      actorId: followerId,
      type: 'FOLLOW',
      message: 'started following you',
    });
    return { following: true };
  },
};
