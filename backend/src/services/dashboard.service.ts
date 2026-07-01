import { prisma } from '../config/prisma';
import { cacheAside, cacheKeys } from '../config/redis';

export const dashboardService = {
  /** Aggregated stats + recent activity for the logged-in user. Cached 30s. */
  async get(userId: string) {
    return cacheAside(cacheKeys.dashboard(userId), 30, async () => {
      const [
        totalPlaylists,
        publicPlaylists,
        favoriteSongs,
        favoritePlaylists,
        totalLikesReceived,
        recentlyCreated,
        recentlyPlayed,
      ] = await Promise.all([
        prisma.playlist.count({ where: { ownerId: userId } }),
        prisma.playlist.count({ where: { ownerId: userId, isPublic: true } }),
        prisma.favorite.count({ where: { userId, target: 'SONG' } }),
        prisma.favorite.count({ where: { userId, target: 'PLAYLIST' } }),
        prisma.like.count({ where: { playlist: { ownerId: userId } } }),
        prisma.playlist.findMany({
          where: { ownerId: userId },
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: { _count: { select: { songs: true, likes: true } } },
        }),
        prisma.recentlyPlayed.findMany({
          where: { userId },
          orderBy: { playedAt: 'desc' },
          take: 8,
          distinct: ['songId'],
          include: {
            song: {
              include: {
                artist: { select: { id: true, name: true } },
                album: { select: { coverUrl: true } },
              },
            },
          },
        }),
      ]);

      return {
        stats: {
          totalPlaylists,
          publicPlaylists,
          favoriteSongs,
          favoritePlaylists,
          totalLikes: totalLikesReceived,
        },
        recentlyCreated,
        recentlyPlayed: recentlyPlayed.map((r) => r.song),
      };
    });
  },
};
