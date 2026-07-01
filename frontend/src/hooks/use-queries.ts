'use client';

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type {
  DashboardData,
  Playlist,
  Song,
  Comment,
  Genre,
  User,
  PageMeta,
  AppNotification,
} from '@/lib/types';

interface Page<T> {
  data: T[];
  meta: PageMeta;
}

// ── Dashboard ─────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<{ data: DashboardData }>('/dashboard').then((r) => r.data),
  });
}

// ── Genres ────────────────────────────────────────────────────
export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: () => api.get<{ data: Genre[] }>('/search/genres').then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

// ── Explore (infinite) ────────────────────────────────────────
export function useExplore(feed: string) {
  return useInfiniteQuery({
    queryKey: ['explore', feed],
    queryFn: ({ pageParam = 1 }) =>
      api.get<Page<Playlist>>(`/playlists/explore?feed=${feed}&page=${pageParam}&limit=12`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
  });
}

// ── Songs (infinite search/browse) ────────────────────────────
export function useSongs(params: { q?: string; genre?: string; sort?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.genre) qs.set('genre', params.genre);
  if (params.sort) qs.set('sort', params.sort);

  return useInfiniteQuery({
    queryKey: ['songs', params],
    queryFn: ({ pageParam = 1 }) =>
      api.get<Page<Song>>(`/songs?${qs.toString()}&page=${pageParam}&limit=20`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNext ? last.meta.page + 1 : undefined),
  });
}

export function useSong(id: string) {
  return useQuery({
    queryKey: ['song', id],
    queryFn: () => api.get<{ data: Song }>(`/songs/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

// ── Playlist detail ───────────────────────────────────────────
export function usePlaylist(id: string) {
  return useQuery({
    queryKey: ['playlist', id],
    queryFn: () => api.get<{ data: Playlist }>(`/playlists/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

// ── Profile ───────────────────────────────────────────────────
export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get<{ data: User }>(`/users/${username}`).then((r) => r.data),
    enabled: !!username,
  });
}

export function useUserPlaylists(username: string) {
  return useQuery({
    queryKey: ['user-playlists', username],
    queryFn: () => api.get<Page<Playlist>>(`/users/${username}/playlists?limit=50`).then((r) => r.data),
    enabled: !!username,
  });
}

// ── Favorites ─────────────────────────────────────────────────
export function useFavoriteSongs() {
  return useQuery({
    queryKey: ['favorites', 'songs'],
    queryFn: () => api.get<Page<Song>>('/favorites/songs?limit=100').then((r) => r.data),
  });
}
export function useFavoritePlaylists() {
  return useQuery({
    queryKey: ['favorites', 'playlists'],
    queryFn: () => api.get<Page<Playlist>>('/favorites/playlists?limit=100').then((r) => r.data),
  });
}

// ── Comments ──────────────────────────────────────────────────
export function useComments(playlistId: string) {
  return useQuery({
    queryKey: ['comments', playlistId],
    // Keep the full envelope — the UI needs both the list and meta.total.
    queryFn: () => api.get<Page<Comment>>(`/playlists/${playlistId}/comments?limit=50`),
    enabled: !!playlistId,
  });
}

// ── Notifications ─────────────────────────────────────────────
export function useNotifications() {
  const isLoggedIn = useAuthStore((s) => !!s.user);
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Page<AppNotification>>('/notifications?limit=20'),
    enabled: isLoggedIn,
    refetchInterval: 60_000,
  });
}

// ── Mutations: like / favorite toggles ────────────────────────
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { target: 'SONG' | 'PLAYLIST' | 'COMMENT'; id: string }) =>
      api.post<{ data: { liked: boolean; count: number } }>('/likes/toggle', v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playlist'] });
      qc.invalidateQueries({ queryKey: ['song'] });
      qc.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { target: 'SONG' | 'PLAYLIST'; id: string }) =>
      api.post<{ data: { favorited: boolean } }>('/favorites/toggle', v),
    onSuccess: (res) => {
      toast.success(res.data.favorited ? 'Added to favorites' : 'Removed from favorites');
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['playlist'] });
      qc.invalidateQueries({ queryKey: ['song'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
