import { prisma } from '../config/prisma';
import { invalidate, cacheKeys } from '../config/redis';
import { AppError } from '../utils/errors';
import { notificationService } from './notification.service';

type Target = 'SONG' | 'PLAYLIST' | 'COMMENT';

async function ensureTargetExists(target: Target, id: string) {
  const found =
    target === 'SONG'
      ? await prisma.song.findUnique({ where: { id }, select: { id: true } })
      : target === 'PLAYLIST'
        ? await prisma.playlist.findUnique({ where: { id }, select: { id: true, ownerId: true } })
        : await prisma.comment.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!found) throw AppError.notFound(`${target.toLowerCase()} not found`);
  return found;
}

function whereFor(userId: string, target: Target, id: string) {
  if (target === 'SONG') return { userId_songId: { userId, songId: id } };
  if (target === 'PLAYLIST') return { userId_playlistId: { userId, playlistId: id } };
  return { userId_commentId: { userId, commentId: id } };
}

export const likeService = {
  async toggle(userId: string, target: Target, id: string) {
    const entity = await ensureTargetExists(target, id);

    const existing = await prisma.like.findUnique({ where: whereFor(userId, target, id) as never });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      if (target === 'PLAYLIST') await invalidate([cacheKeys.playlist(id), 'explore:*', cacheKeys.trending]);
      const count = await this.count(target, id);
      return { liked: false, count };
    }

    await prisma.like.create({
      data: {
        userId,
        target,
        songId: target === 'SONG' ? id : null,
        playlistId: target === 'PLAYLIST' ? id : null,
        commentId: target === 'COMMENT' ? id : null,
      },
    });

    // Notify the owner (best-effort, never notify self).
    const ownerId =
      target === 'PLAYLIST'
        ? (entity as { ownerId?: string }).ownerId
        : target === 'COMMENT'
          ? (entity as { authorId?: string }).authorId
          : undefined;
    if (ownerId && ownerId !== userId) {
      void notificationService.create({
        userId: ownerId,
        actorId: userId,
        type: 'LIKE',
        message: `liked your ${target.toLowerCase()}`,
        link: target === 'PLAYLIST' ? `/playlists/${id}` : undefined,
      });
    }

    if (target === 'PLAYLIST') await invalidate([cacheKeys.playlist(id), 'explore:*', cacheKeys.trending]);
    const count = await this.count(target, id);
    return { liked: true, count };
  },

  async count(target: Target, id: string) {
    if (target === 'SONG') return prisma.like.count({ where: { songId: id } });
    if (target === 'PLAYLIST') return prisma.like.count({ where: { playlistId: id } });
    return prisma.like.count({ where: { commentId: id } });
  },
};
