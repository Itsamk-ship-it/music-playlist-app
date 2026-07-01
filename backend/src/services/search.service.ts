import { prisma } from '../config/prisma';
import { cacheAside, cacheKeys } from '../config/redis';

type SearchType = 'all' | 'songs' | 'artists' | 'albums' | 'playlists' | 'users';

export const searchService = {
  /** Global search across entities. Popular queries are cached in Redis. */
  async search(q: string, type: SearchType = 'all', limit = 8) {
    const cacheKey = cacheKeys.search(q, type);
    return cacheAside(cacheKey, 45, async () => {
      const term = q.trim();
      const ci = { contains: term, mode: 'insensitive' as const };

      const wantAll = type === 'all';
      const result: Record<string, unknown> = {};

      if (wantAll || type === 'songs') {
        result.songs = await prisma.song.findMany({
          where: { OR: [{ title: ci }, { artist: { name: ci } }] },
          take: limit,
          include: {
            artist: { select: { id: true, name: true } },
            album: { select: { id: true, coverUrl: true } },
          },
        });
      }
      if (wantAll || type === 'artists') {
        result.artists = await prisma.artist.findMany({
          where: { name: ci },
          take: limit,
          include: { _count: { select: { songs: true } } },
        });
      }
      if (wantAll || type === 'albums') {
        result.albums = await prisma.album.findMany({
          where: { OR: [{ title: ci }, { artist: { name: ci } }] },
          take: limit,
          include: { artist: { select: { id: true, name: true } } },
        });
      }
      if (wantAll || type === 'playlists') {
        result.playlists = await prisma.playlist.findMany({
          where: { isPublic: true, OR: [{ name: ci }, { description: ci }] },
          take: limit,
          include: {
            owner: { select: { id: true, username: true, name: true, avatarUrl: true } },
            _count: { select: { songs: true, likes: true } },
          },
        });
      }
      if (wantAll || type === 'users') {
        result.users = await prisma.user.findMany({
          where: { isPublic: true, OR: [{ username: ci }, { name: ci }] },
          take: limit,
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            _count: { select: { playlists: true } },
          },
        });
      }
      return result;
    });
  },
};
