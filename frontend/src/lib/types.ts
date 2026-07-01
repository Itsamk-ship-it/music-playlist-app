export interface User {
  id: string;
  email?: string;
  username: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  favoriteGenre?: string | null;
  isPublic: boolean;
  role?: string;
  createdAt?: string;
  likeCount?: number;
  isFollowing?: boolean;
  _count?: { playlists: number; followers: number; following: number };
}

export interface Artist {
  id: string;
  name: string;
  bio?: string | null;
  imageUrl?: string | null;
  _count?: { songs: number; albums: number };
}

export interface Album {
  id: string;
  title: string;
  coverUrl?: string | null;
  releaseYear?: number | null;
  artist?: { id: string; name: string };
}

export interface Song {
  id: string;
  title: string;
  duration: number;
  releaseYear?: number | null;
  coverUrl?: string | null;
  description?: string | null;
  artist?: { id: string; name: string };
  album?: { id: string; title: string; coverUrl?: string | null } | null;
  genre?: { id: string; name: string } | null;
  likedByViewer?: boolean;
  favoritedByViewer?: boolean;
  _count?: { likes: number; favorites: number };
}

export interface PlaylistSong {
  id: string;
  position: number;
  song: Song;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  coverUrl?: string | null;
  isPublic: boolean;
  isFeatured?: boolean;
  views: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; username: string; name: string; avatarUrl?: string | null };
  songs?: PlaylistSong[];
  likedByViewer?: boolean;
  favoritedByViewer?: boolean;
  _count?: { songs: number; likes: number; favorites?: number; comments?: number };
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; username: string; name: string; avatarUrl?: string | null };
  likedByViewer?: boolean;
  _count?: { likes: number };
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  _count?: { songs: number };
}

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
  actor?: { id: string; username: string; name: string; avatarUrl?: string | null } | null;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  unread?: number;
}

export interface DashboardData {
  stats: {
    totalPlaylists: number;
    publicPlaylists: number;
    favoriteSongs: number;
    favoritePlaylists: number;
    totalLikes: number;
  };
  recentlyCreated: Playlist[];
  recentlyPlayed: Song[];
}
