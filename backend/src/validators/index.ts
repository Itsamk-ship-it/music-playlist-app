import { z } from 'zod';

// ── Auth ───────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

// ── User profile ───────────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  favoriteGenre: z.string().max(50).optional().nullable(),
  isPublic: z.boolean().optional(),
});

// ── Playlists ──────────────────────────────────────────────────
export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().optional().default(false),
  songIds: z.array(z.string()).optional(),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const addSongSchema = z.object({
  songId: z.string().min(1),
});

export const reorderSchema = z.object({
  // ordered list of songIds representing the new order
  songIds: z.array(z.string().min(1)).min(1),
});

// ── Comments ───────────────────────────────────────────────────
export const createCommentSchema = z.object({
  playlistId: z.string().min(1),
  body: z.string().min(1).max(1000),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1).max(1000),
});

// ── Likes / Favorites ──────────────────────────────────────────
export const likeSchema = z.object({
  target: z.enum(['SONG', 'PLAYLIST', 'COMMENT']),
  id: z.string().min(1),
});

export const favoriteSchema = z.object({
  target: z.enum(['SONG', 'PLAYLIST']),
  id: z.string().min(1),
});

// ── Query params ───────────────────────────────────────────────
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const searchQuery = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['all', 'songs', 'artists', 'albums', 'playlists', 'users']).optional(),
  genre: z.string().optional(),
  sort: z.enum(['relevance', 'newest', 'popular']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const exploreQuery = z.object({
  feed: z.enum(['trending', 'new', 'liked', 'updated', 'featured']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
