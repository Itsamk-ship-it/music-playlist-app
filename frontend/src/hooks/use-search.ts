'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Song, Artist, Album, Playlist, User } from '@/lib/types';
import { useDebounce } from './use-debounce';

export interface SearchResults {
  songs?: Song[];
  artists?: Artist[];
  albums?: Album[];
  playlists?: Playlist[];
  users?: User[];
}

export function useSearch(query: string, type = 'all') {
  const debounced = useDebounce(query.trim(), 350);
  return useQuery({
    queryKey: ['search', debounced, type],
    queryFn: () =>
      api
        .get<{ data: SearchResults }>(
          `/search?q=${encodeURIComponent(debounced)}&type=${type}`,
          { auth: false },
        )
        .then((r) => r.data),
    enabled: debounced.length >= 2,
    staleTime: 45_000,
  });
}
