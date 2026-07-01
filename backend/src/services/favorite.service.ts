import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { invalidate, cacheKeys } from '../config/redis';
import { AppError } from '../utils/errors';
import { PageParams, buildPageMeta } from '../utils/pagination';

type Target = 'SONG' | 'PLAYLIST';

export const favoriteService = {
  async toggle(userId: string, target: Target, id: string) {
    if (target === 'SONG') {
      const song = await prisma.song.findUnique({ where: { id }, select: { id: true } });
      if (!song) throw AppError.notFound('Song not found');
      const existing = await prisma.favorite.findUnique({
        where: { userId_songId: { userId, songId: id } },
      });
      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } });
        await invalidate([cacheKeys.dashboard(userId)]);
        return { favorited: false };
      }
      await prisma.favorite.create({ data: { userId, target, songId: id } });
      await invalidate([cacheKeys.dashboard(userId)]);
      return { favorited: true };
    }

    const playlist = await prisma.playlist.findUnique({ where: { id }, select: { id: true } });
    if (!playlist) throw AppError.notFound('Playlist not found');
    const existing = await prisma.favorite.findUnique({
      where: { userId_playlistId: { userId, playlistId: id } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      await invalidate([cacheKeys.dashboard(userId), cacheKeys.playlist(id)]);
      return { favorited: false };
    }
    await prisma.favorite.create({ data: { userId, target, playlistId: id } });
    await invalidate([cacheKeys.dashboard(userId), cacheKeys.playlist(id)]);
    return { favorited: true };
  },

  async listSongs(userId: string, page: PageParams) {
    const where: Prisma.FavoriteWhereInput = { userId, target: 'SONG' };
    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.limit,
        include: {
          song: {
            include: {
              artist: { select: { id: true, name: true } },
              album: { select: { id: true, title: true, coverUrl: true } },
              genre: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.favorite.count({ where }),
    ]);
    return { items: items.map((f) => f.song).filter(Boolean), meta: buildPageMeta(total, page) };
  },

  async listPlaylists(userId: string, page: PageParams) {
    const where: Prisma.FavoriteWhereInput = { userId, target: 'PLAYLIST' };
    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.limit,
        include: {
          playlist: {
            include: {
              owner: { select: { id: true, username: true, name: true, avatarUrl: true } },
              _count: { select: { songs: true, likes: true } },
            },
          },
        },
      }),
      prisma.favorite.count({ where }),
    ]);
    return { items: items.map((f) => f.playlist).filter(Boolean), meta: buildPageMeta(total, page) };
  },
};
