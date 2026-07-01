import { prisma } from '../config/prisma';
import { invalidate, cacheKeys } from '../config/redis';
import { AppError } from '../utils/errors';
import { PageParams, buildPageMeta } from '../utils/pagination';
import { notificationService } from './notification.service';

const authorSelect = { id: true, username: true, name: true, avatarUrl: true };

export const commentService = {
  async list(playlistId: string, viewerId: string | undefined, page: PageParams) {
    const [items, total] = await Promise.all([
      prisma.comment.findMany({
        where: { playlistId },
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.limit,
        include: {
          author: { select: authorSelect },
          _count: { select: { likes: true } },
          likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
        },
      }),
      prisma.comment.count({ where: { playlistId } }),
    ]);

    const mapped = items.map((c) => ({
      ...c,
      likedByViewer: Array.isArray(c.likes) ? c.likes.length > 0 : false,
      likes: undefined,
    }));
    return { items: mapped, meta: buildPageMeta(total, page) };
  },

  async create(userId: string, playlistId: string, body: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      select: { id: true, isPublic: true, ownerId: true },
    });
    if (!playlist) throw AppError.notFound('Playlist not found');
    if (!playlist.isPublic && playlist.ownerId !== userId) {
      throw AppError.forbidden('Cannot comment on a private playlist');
    }

    const comment = await prisma.comment.create({
      data: { authorId: userId, playlistId, body },
      include: { author: { select: authorSelect }, _count: { select: { likes: true } } },
    });

    if (playlist.ownerId !== userId) {
      void notificationService.create({
        userId: playlist.ownerId,
        actorId: userId,
        type: 'COMMENT',
        message: 'commented on your playlist',
        link: `/playlists/${playlistId}`,
      });
    }
    await invalidate([cacheKeys.playlist(playlistId)]);
    return { ...comment, likedByViewer: false };
  },

  async update(userId: string, commentId: string, body: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw AppError.notFound('Comment not found');
    if (comment.authorId !== userId) throw AppError.forbidden('You can only edit your own comments');

    return prisma.comment.update({
      where: { id: commentId },
      data: { body },
      include: { author: { select: authorSelect }, _count: { select: { likes: true } } },
    });
  },

  async remove(userId: string, role: string, commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { playlist: { select: { ownerId: true } } },
    });
    if (!comment) throw AppError.notFound('Comment not found');

    const canDelete =
      comment.authorId === userId || comment.playlist.ownerId === userId || role === 'ADMIN';
    if (!canDelete) throw AppError.forbidden('Not allowed to delete this comment');

    await prisma.comment.delete({ where: { id: commentId } });
    await invalidate([cacheKeys.playlist(comment.playlistId)]);
  },
};
