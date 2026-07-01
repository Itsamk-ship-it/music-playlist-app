/**
 * Seed script — generates a rich demo dataset:
 *   1 admin, 20 users, 10 genres, ~60 artists, 50 albums, 500 songs,
 *   100 playlists, 1000+ playlist-song links, plus likes, favorites, comments.
 *
 * Deterministic (no randomness that breaks reproducibility beyond a seeded PRNG),
 * idempotent-ish: it clears existing rows first. Run with `npm run seed`.
 *
 * All images use free, key-less services (picsum.photos, dicebear).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Tiny seeded PRNG for reproducible "random" picks ───────────
let seed = 1337;
function rng() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const rand = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const cover = (key: string | number) => `https://picsum.photos/seed/mpa-${key}/400/400`;
const avatar = (key: string) => `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(key)}`;

const GENRES = [
  { name: 'Pop', slug: 'pop', color: '#ec4899' },
  { name: 'Rock', slug: 'rock', color: '#ef4444' },
  { name: 'Hip-Hop', slug: 'hip-hop', color: '#f59e0b' },
  { name: 'Jazz', slug: 'jazz', color: '#8b5cf6' },
  { name: 'Classical', slug: 'classical', color: '#6366f1' },
  { name: 'Electronic', slug: 'electronic', color: '#06b6d4' },
  { name: 'Country', slug: 'country', color: '#d97706' },
  { name: 'R&B', slug: 'rnb', color: '#a855f7' },
  { name: 'Lo-fi', slug: 'lo-fi', color: '#14b8a6' },
  { name: 'Instrumental', slug: 'instrumental', color: '#64748b' },
];

const ARTIST_FIRST = [
  'Neon', 'Velvet', 'Cosmic', 'Midnight', 'Golden', 'Silver', 'Electric', 'Crystal',
  'Scarlet', 'Azure', 'Wild', 'Silent', 'Echo', 'Lunar', 'Solar', 'Amber',
  'Crimson', 'Frost', 'Ember', 'Shadow',
];
const ARTIST_SECOND = [
  'Tigers', 'Waves', 'Collective', 'Society', 'Orchestra', 'Brothers', 'Sisters',
  'Machine', 'Kids', 'Ghosts', 'Republic', 'Avenue', 'District', 'Lights',
  'Horizon', 'Anthem', 'Union', 'Theory', 'Project', 'Empire',
];

const SONG_WORDS_A = [
  'Midnight', 'Golden', 'Broken', 'Electric', 'Silent', 'Endless', 'Fading',
  'Neon', 'Velvet', 'Distant', 'Frozen', 'Burning', 'Hollow', 'Restless',
  'Weightless', 'Crimson', 'Gentle', 'Savage', 'Lonely', 'Radiant',
];
const SONG_WORDS_B = [
  'Dreams', 'Lights', 'Rivers', 'Echoes', 'Skies', 'Hearts', 'Shadows',
  'Horizons', 'Memories', 'Storms', 'Roads', 'Fires', 'Waves', 'Nights',
  'Secrets', 'Reflections', 'Highways', 'Seasons', 'Whispers', 'Moments',
];

async function clear() {
  console.log('› clearing existing data...');
  // Order matters for FK constraints.
  await prisma.$transaction([
    prisma.recentlyPlayed.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.like.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.playlistSong.deleteMany(),
    prisma.playlist.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.session.deleteMany(),
    prisma.song.deleteMany(),
    prisma.album.deleteMany(),
    prisma.artist.deleteMany(),
    prisma.genre.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  await clear();

  // ── Genres ───────────────────────────────────────────────────
  console.log('› genres');
  const genres = await Promise.all(
    GENRES.map((g) => prisma.genre.create({ data: g })),
  );

  // ── Users ────────────────────────────────────────────────────
  console.log('› users (admin + 20)');
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@mpa.dev',
      username: 'admin',
      name: 'Site Admin',
      passwordHash,
      role: 'ADMIN',
      bio: 'Curator-in-chief of the Music Playlist app.',
      avatarUrl: avatar('admin'),
      favoriteGenre: 'Electronic',
      isPublic: true,
    },
  });

  const users = [admin];
  for (let i = 1; i <= 20; i++) {
    const username = `demo_user_${i}`;
    users.push(
      await prisma.user.create({
        data: {
          email: `user${i}@mpa.dev`,
          username,
          name: `Demo User ${i}`,
          passwordHash,
          bio: `Playlist enthusiast #${i}. Always hunting for the next favorite track.`,
          avatarUrl: avatar(username),
          favoriteGenre: pick(GENRES).name,
          isPublic: rng() > 0.15,
        },
      }),
    );
  }

  // ── Artists ──────────────────────────────────────────────────
  console.log('› artists');
  const artistNames = new Set<string>();
  while (artistNames.size < 60) {
    artistNames.add(`${pick(ARTIST_FIRST)} ${pick(ARTIST_SECOND)}`);
  }
  const artists = await Promise.all(
    [...artistNames].map((name, i) =>
      prisma.artist.create({
        data: {
          name,
          bio: `${name} is a genre-blending act known for atmospheric live shows.`,
          imageUrl: cover(`artist-${i}`),
        },
      }),
    ),
  );

  // ── Albums ───────────────────────────────────────────────────
  console.log('› albums (50)');
  const albums = [];
  for (let i = 0; i < 50; i++) {
    const artist = pick(artists);
    albums.push(
      await prisma.album.create({
        data: {
          title: `${pick(SONG_WORDS_A)} ${pick(SONG_WORDS_B)}`,
          artistId: artist.id,
          coverUrl: cover(`album-${i}`),
          releaseYear: rand(1998, 2025),
        },
      }),
    );
  }

  // ── Songs (500) ──────────────────────────────────────────────
  console.log('› songs (500)');
  const songData = [];
  for (let i = 0; i < 500; i++) {
    const album = pick(albums);
    const title = `${pick(SONG_WORDS_A)} ${pick(SONG_WORDS_B)}`;
    songData.push({
      title,
      artistId: album.artistId,
      albumId: album.id,
      genreId: pick(genres).id,
      duration: rand(120, 360),
      releaseYear: album.releaseYear,
      coverUrl: album.coverUrl,
      description: `"${title}" — a standout track with layered production and a memorable hook.`,
    });
  }
  await prisma.song.createMany({ data: songData });
  const songs = await prisma.song.findMany({ select: { id: true } });
  const songIds = songs.map((s) => s.id);

  // ── Playlists (100) + playlist songs (1000+) ─────────────────
  console.log('› playlists (100) + playlist songs');
  const playlistAdjectives = ['Late Night', 'Morning', 'Focus', 'Workout', 'Chill', 'Road Trip', 'Party', 'Rainy Day', 'Throwback', 'Deep'];
  const playlistNouns = ['Vibes', 'Mix', 'Sessions', 'Anthems', 'Grooves', 'Essentials', 'Selects', 'Rotation', 'Favorites', 'Energy'];

  const playlists = [];
  for (let i = 0; i < 100; i++) {
    const owner = pick(users);
    const isPublic = rng() > 0.25;
    const playlist = await prisma.playlist.create({
      data: {
        name: `${pick(playlistAdjectives)} ${pick(playlistNouns)}`,
        description: 'A hand-picked collection of tracks for every mood.',
        coverUrl: cover(`playlist-${i}`),
        isPublic,
        isFeatured: isPublic && rng() > 0.85,
        views: rand(0, 5000),
        ownerId: owner.id,
      },
    });

    // 8–18 unique songs per playlist.
    const count = rand(8, 18);
    const chosen = new Set<string>();
    while (chosen.size < count) chosen.add(pick(songIds));
    await prisma.playlistSong.createMany({
      data: [...chosen].map((songId, position) => ({ playlistId: playlist.id, songId, position })),
    });
    playlists.push(playlist);
  }

  // ── Favorites ────────────────────────────────────────────────
  console.log('› favorites');
  for (const user of users) {
    const favSongs = new Set<string>();
    for (let i = 0; i < rand(5, 25); i++) favSongs.add(pick(songIds));
    await prisma.favorite.createMany({
      data: [...favSongs].map((songId) => ({ userId: user.id, target: 'SONG' as const, songId })),
      skipDuplicates: true,
    });

    const favPlaylists = new Set<string>();
    for (let i = 0; i < rand(2, 8); i++) favPlaylists.add(pick(playlists).id);
    await prisma.favorite.createMany({
      data: [...favPlaylists].map((playlistId) => ({ userId: user.id, target: 'PLAYLIST' as const, playlistId })),
      skipDuplicates: true,
    });
  }

  // ── Likes (songs + playlists) ────────────────────────────────
  console.log('› likes');
  for (const user of users) {
    const likedSongs = new Set<string>();
    for (let i = 0; i < rand(10, 40); i++) likedSongs.add(pick(songIds));
    await prisma.like.createMany({
      data: [...likedSongs].map((songId) => ({ userId: user.id, target: 'SONG' as const, songId })),
      skipDuplicates: true,
    });

    const likedPlaylists = new Set<string>();
    for (let i = 0; i < rand(5, 20); i++) likedPlaylists.add(pick(playlists).id);
    await prisma.like.createMany({
      data: [...likedPlaylists].map((playlistId) => ({ userId: user.id, target: 'PLAYLIST' as const, playlistId })),
      skipDuplicates: true,
    });
  }

  // ── Comments (on public playlists) ───────────────────────────
  console.log('› comments');
  const commentBodies = [
    'This is exactly what I needed today 🔥',
    'Adding this to my rotation immediately.',
    'Track 3 hits so hard.',
    'Perfect for late-night coding sessions.',
    'How did you find all these gems?',
    'Instant favorite. Following you now!',
    'The flow between songs is *chef’s kiss*.',
    'Been on repeat all week.',
  ];
  const publicPlaylists = playlists.filter((p) => p.isPublic);
  for (const playlist of publicPlaylists) {
    const n = rand(0, 5);
    for (let i = 0; i < n; i++) {
      await prisma.comment.create({
        data: {
          playlistId: playlist.id,
          authorId: pick(users).id,
          body: pick(commentBodies),
        },
      });
    }
  }

  // ── Follows + recently played ────────────────────────────────
  console.log('› follows + recently played');
  for (const user of users) {
    const toFollow = new Set<string>();
    for (let i = 0; i < rand(2, 8); i++) {
      const other = pick(users);
      if (other.id !== user.id) toFollow.add(other.id);
    }
    await prisma.follow.createMany({
      data: [...toFollow].map((followingId) => ({ followerId: user.id, followingId })),
      skipDuplicates: true,
    });

    const played = new Set<string>();
    for (let i = 0; i < rand(5, 15); i++) played.add(pick(songIds));
    await prisma.recentlyPlayed.createMany({
      data: [...played].map((songId) => ({ userId: user.id, songId })),
    });
  }

  const totals = {
    users: users.length,
    genres: genres.length,
    artists: artists.length,
    albums: albums.length,
    songs: songIds.length,
    playlists: playlists.length,
    playlistSongs: await prisma.playlistSong.count(),
    likes: await prisma.like.count(),
    favorites: await prisma.favorite.count(),
    comments: await prisma.comment.count(),
  };
  console.log('✔ seed complete:', totals);
  console.log('\n  Login with:  admin@mpa.dev  /  Password123!');
  console.log('           or  user1@mpa.dev  /  Password123!\n');
}

main()
  .catch((e) => {
    console.error('seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
