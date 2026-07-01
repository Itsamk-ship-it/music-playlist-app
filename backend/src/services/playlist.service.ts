import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { redis, cacheAside, invalidate, cacheKeys } from '../config/redis';
import { AppError } from '../utils/errors';
import { PageParams, buildPageMeta } from '../utils/pagination';

const ownerSelect = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const summaryInclude = {
  owner: { select: ownerSelect },
  _count: { select: { songs: true, likes: true, favorites: true, comments: true } },
} satisfies Prisma.PlaylistInclude;

async function assertOwner(playlistId: string, userId: string) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { id: true, ownerId: true },
  });
  if (!playlist) throw AppError.notFound('Playlist not found');
  if (playlist.ownerId !== userId) throw AppError.forbidden('You do not own this playlist');
  return playlist;
}

async function invalidatePlaylistCaches(playlistId: string, ownerId?: string) {
  const patterns = [cacheKeys.playlist(playlistId), 'explore:*', cacheKeys.trending];
  if (ownerId) patterns.push(cacheKeys.dashboard(ownerId));
  await invalidate(patterns);
}

export const playlistService = {
  async create(
    userId: string,
    input: { name: string; description?: string | null; coverUrl?: string | null; isPublic?: boolean; songIds?: string[] },
  ) {
    const playlist = await prisma.playlist.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        coverUrl: input.coverUrl ?? null,
        isPublic: input.isPublic ?? false,
        ownerId: userId,
        songs: input.songIds?.length
          ? {
              create: input.songIds.map((songId, i) => ({ songId, position: i })),
            }
          : undefined,
      },
      include: summaryInclude,
    });
    await invalidatePlaylistCaches(playlist.id, userId);
    return playlist;
  },

  async update(
    playlistId: string,
    userId: string,
    input: { name?: string; description?: string | null; coverUrl?: string | null; isPublic?: boolean },
  ) {
    await assertOwner(playlistId, userId);
    const playlist = await prisma.playlist.update({
      where: { id: playlistId },
      data: input,
      include: summaryInclude,
    });
    await invalidatePlaylistCaches(playlistId, userId);
    return playlist;
  },

  async remove(playlistId: string, userId: string) {
    await assertOwner(playlistId, userId);
    await prisma.playlist.delete({ where: { id: playlistId } });
    await invalidatePlaylistCaches(playlistId, userId);
  },

  async duplicate(playlistId: string, userId: string) {
    const source = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { songs: { orderBy: { position: 'asc' } } },
    });
    if (!source) throw AppError.notFound('Playlist not found');
    if (!source.isPublic && source.ownerId !== userId) {
      throw AppError.forbidden('Cannot duplicate a private playlist you do not own');
    }

    const copy = await prisma.playlist.create({
      data: {
        name: `${source.name} (Copy)`,
        description: source.description,
        coverUrl: source.coverUrl,
        isPublic: false,
        ownerId: userId,
        songs: {
          create: source.songs.map((s) => ({ songId: s.songId, position: s.position })),
        },
      },
      include: summaryInclude,
    });
    await invalidatePlaylistCaches(copy.id, userId);
    return copy;
  },

  /** Full detail view. Cached in Redis (response cache). Increments views. */
  async getById(playlistId: string, viewerId?: string) {
    const cacheKey = cacheKeys.playlist(playlistId);
    const playlist = await cacheAside(cacheKey, 60, async () => {
      const found = await prisma.playlist.findUnique({
        where: { id: playlistId },
        include: {
          owner: { select: ownerSelect },
          _count: { select: { songs: true, likes: true, favorites: true, comments: true } },
          songs: {
            orderBy: { position: 'asc' },
            include: {
              song: {
                include: {
                  artist: { select: { id: true, name: true } },
                  album: { select: { id: true, title: true, coverUrl: true } },
                  genre: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });
      if (!found) throw AppError.notFound('Playlist not found');
      return found;
    });

    if (!playlist.isPublic && playlist.ownerId !== viewerId) {
      throw AppError.forbidden('This playlist is private');
    }

    // Fire-and-forget view increment (not part of cached payload).
    void prisma.playlist
      .update({ where: { id: playlistId }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    let likedByViewer = false;
    let favoritedByViewer = false;
    if (viewerId) {
      const [like, fav] = await Promise.all([
        prisma.like.findUnique({ where: { userId_playlistId: { userId: viewerId, playlistId } } }),
        prisma.favorite.findUnique({ where: { userId_playlistId: { userId: viewerId, playlistId } } }),
      ]);
      likedByViewer = !!like;
      favoritedByViewer = !!fav;
    }

    return { ...playlist, likedByViewer, favoritedByViewer };
  },

  async listByOwner(ownerId: string, viewerId: string | undefined, page: PageParams) {
    const where: Prisma.PlaylistWhereInput = {
      ownerId,
      ...(ownerId === viewerId ? {} : { isPublic: true }),
    };
    const [items, total] = await Promise.all([
      prisma.playlist.findMany({
        where,
        include: summaryInclude,
        orderBy: { updatedAt: 'desc' },
        skip: page.skip,
        take: page.limit,
      }),
      prisma.playlist.count({ where }),
    ]);
    return { items, meta: buildPageMeta(total, page) };
  },

  /** Explore feeds — cached per feed+page. */
  async explore(feed: string, page: PageParams) {
    const cacheKey = cacheKeys.explore(feed, page.page);
    return cacheAside(cacheKey, 30, async () => {
      const base: Prisma.PlaylistWhereInput = { isPublic: true };

      let orderBy: Prisma.PlaylistOrderByWithRelationInput | Prisma.PlaylistOrderByWithRelationInput[];
      let where = base;
      switch (feed) {
        case 'new':
          orderBy = { createdAt: 'desc' };
          break;
        case 'liked':
          orderBy = { likes: { _count: 'desc' } };
          break;
        case 'updated':
          orderBy = { updatedAt: 'desc' };
          break;
        case 'featured':
          where = { ...base, isFeatured: true };
          orderBy = { views: 'desc' };
          break;
        case 'trending':
        default:
          // trending = weighted by views + recent likes
          orderBy = [{ views: 'desc' }, { likes: { _count: 'desc' } }];
          break;
      }

      const [items, total] = await Promise.all([
        prisma.playlist.findMany({
          where,
          include: summaryInclude,
          orderBy,
          skip: page.skip,
          take: page.limit,
        }),
        prisma.playlist.count({ where }),
      ]);
      return { items, meta: buildPageMeta(total, page) };
    });
  },

  // ── Song management ──────────────────────────────────────────
  async addSong(playlistId: string, userId: string, songId: string) {
    await assertOwner(playlistId, userId);

    const song = await prisma.song.findUnique({ where: { id: songId }, select: { id: true } });
    if (!song) throw AppError.notFound('Song not found');

    const existing = await prisma.playlistSong.findUnique({
      where: { playlistId_songId: { playlistId, songId } },
    });
    if (existing) throw AppError.conflict('Song already in playlist');

    const max = await prisma.playlistSong.aggregate({
      where: { playlistId },
      _max: { position: true },
    });
    const position = (max._max.position ?? -1) + 1;

    await prisma.playlistSong.create({ data: { playlistId, songId, position } });
    await prisma.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } });
    await invalidatePlaylistCaches(playlistId, userId);
  },

  async removeSong(playlistId: string, userId: string, songId: string) {
    await assertOwner(playlistId, userId);
    await prisma.playlistSong.deleteMany({ where: { playlistId, songId } });

    // Re-normalize positions to keep them contiguous.
    const remaining = await prisma.playlistSong.findMany({
      where: { playlistId },
      orderBy: { position: 'asc' },
    });
    await prisma.$transaction(
      remaining.map((ps, i) =>
        prisma.playlistSong.update({ where: { id: ps.id }, data: { position: i } }),
      ),
    );
    await invalidatePlaylistCaches(playlistId, userId);
  },

  async reorder(playlistId: string, userId: string, orderedSongIds: string[]) {
    await assertOwner(playlistId, userId);

    const current = await prisma.playlistSong.findMany({
      where: { playlistId },
      select: { songId: true },
    });
    const currentSet = new Set(current.map((c) => c.songId));
    if (orderedSongIds.length !== current.length || orderedSongIds.some((id) => !currentSet.has(id))) {
      throw AppError.badRequest('Reorder list must contain exactly the playlist songs');
    }

    await prisma.$transaction(
      orderedSongIds.map((songId, position) =>
        prisma.playlistSong.update({
          where: { playlistId_songId: { playlistId, songId } },
          data: { position },
        }),
      ),
    );
    await invalidatePlaylistCaches(playlistId, userId);
  },
};
