import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { PageParams, buildPageMeta } from '../utils/pagination';

/** Artists, albums and genres — read-only catalog lookups. */
export const catalogService = {
  async listArtists(q: string | undefined, page: PageParams) {
    const where = q ? { name: { contains: q, mode: 'insensitive' as const } } : {};
    const [items, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: page.skip,
        take: page.limit,
        include: { _count: { select: { songs: true, albums: true } } },
      }),
      prisma.artist.count({ where }),
    ]);
    return { items, meta: buildPageMeta(total, page) };
  },

  async getArtist(id: string) {
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        albums: { orderBy: { releaseYear: 'desc' } },
        songs: { take: 20, include: { album: { select: { title: true, coverUrl: true } } } },
        _count: { select: { songs: true, albums: true } },
      },
    });
    if (!artist) throw AppError.notFound('Artist not found');
    return artist;
  },

  async listAlbums(q: string | undefined, page: PageParams) {
    const where = q ? { title: { contains: q, mode: 'insensitive' as const } } : {};
    const [items, total] = await Promise.all([
      prisma.album.findMany({
        where,
        orderBy: { releaseYear: 'desc' },
        skip: page.skip,
        take: page.limit,
        include: { artist: { select: { id: true, name: true } }, _count: { select: { songs: true } } },
      }),
      prisma.album.count({ where }),
    ]);
    return { items, meta: buildPageMeta(total, page) };
  },

  async getAlbum(id: string) {
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        artist: { select: { id: true, name: true } },
        songs: {
          orderBy: { title: 'asc' },
          include: { genre: { select: { name: true } } },
        },
      },
    });
    if (!album) throw AppError.notFound('Album not found');
    return album;
  },

  async listGenres() {
    return prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { songs: true } } },
    });
  },
};
