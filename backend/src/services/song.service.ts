import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { PageParams, buildPageMeta } from '../utils/pagination';

const songInclude = {
  artist: { select: { id: true, name: true } },
  album: { select: { id: true, title: true, coverUrl: true } },
  genre: { select: { id: true, name: true } },
  _count: { select: { likes: true, favorites: true } },
} satisfies Prisma.SongInclude;

export const songService = {
  async list(
    filters: { q?: string; genre?: string; sort?: string },
    page: PageParams,
  ) {
    const where: Prisma.SongWhereInput = {};
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { artist: { name: { contains: filters.q, mode: 'insensitive' } } },
        { album: { title: { contains: filters.q, mode: 'insensitive' } } },
      ];
    }
    if (filters.genre) where.genre = { slug: filters.genre };

    const orderBy: Prisma.SongOrderByWithRelationInput =
      filters.sort === 'newest'
        ? { createdAt: 'desc' }
        : filters.sort === 'popular'
          ? { likes: { _count: 'desc' } }
          : { title: 'asc' };

    const [items, total] = await Promise.all([
      prisma.song.findMany({ where, include: songInclude, orderBy, skip: page.skip, take: page.limit }),
      prisma.song.count({ where }),
    ]);
    return { items, meta: buildPageMeta(total, page) };
  },

  async getById(id: string, viewerId?: string) {
    const song = await prisma.song.findUnique({ where: { id }, include: songInclude });
    if (!song) throw AppError.notFound('Song not found');

    let likedByViewer = false;
    let favoritedByViewer = false;
    if (viewerId) {
      const [like, fav] = await Promise.all([
        prisma.like.findUnique({ where: { userId_songId: { userId: viewerId, songId: id } } }),
        prisma.favorite.findUnique({ where: { userId_songId: { userId: viewerId, songId: id } } }),
      ]);
      likedByViewer = !!like;
      favoritedByViewer = !!fav;
    }
    return { ...song, likedByViewer, favoritedByViewer };
  },

  /** Record a play in the user's history (keeps last 50). */
  async recordPlay(userId: string, songId: string) {
    const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true } });
    if (!song) throw AppError.notFound('Song not found');
    await prisma.recentlyPlayed.create({ data: { userId, songId } });

    const rows = await prisma.recentlyPlayed.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      skip: 50,
      select: { id: true },
    });
    if (rows.length) {
      await prisma.recentlyPlayed.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
    }
  },
};
