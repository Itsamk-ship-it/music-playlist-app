'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Playlist } from '@/lib/types';
import type { PlaylistInput } from '@/lib/schemas';

export function useCreatePlaylist() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaylistInput) =>
      api.post<{ data: Playlist }>('/playlists', {
        ...input,
        coverUrl: input.coverUrl || undefined,
      }),
    onSuccess: (res) => {
      toast.success('Playlist created');
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/playlists/${res.data.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePlaylist(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PlaylistInput>) =>
      api.patch<{ data: Playlist }>(`/playlists/${id}`, {
        ...input,
        coverUrl: input.coverUrl || undefined,
      }),
    onSuccess: () => {
      toast.success('Playlist updated');
      qc.invalidateQueries({ queryKey: ['playlist', id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePlaylist() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/playlists/${id}`),
    onSuccess: () => {
      toast.success('Playlist deleted');
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.push('/dashboard');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDuplicatePlaylist() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ data: Playlist }>(`/playlists/${id}/duplicate`),
    onSuccess: (res) => {
      toast.success('Playlist duplicated');
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/playlists/${res.data.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePlaylistSongs(id: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['playlist', id] });

  const addSong = useMutation({
    mutationFn: (songId: string) => api.post(`/playlists/${id}/songs`, { songId }),
    onSuccess: () => {
      toast.success('Added to playlist');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSong = useMutation({
    mutationFn: (songId: string) => api.delete(`/playlists/${id}/songs/${songId}`),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: (songIds: string[]) => api.patch(`/playlists/${id}/reorder`, { songIds }),
    onError: (e: Error) => {
      toast.error(e.message);
      invalidate();
    },
  });

  return { addSong, removeSong, reorder };
}
