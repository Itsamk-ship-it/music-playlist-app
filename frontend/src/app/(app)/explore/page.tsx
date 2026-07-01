'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlaylistCard } from '@/components/cards';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/states';
import { useExplore } from '@/hooks/use-queries';

const FEEDS = [
  { key: 'trending', label: 'Trending' },
  { key: 'new', label: 'New' },
  { key: 'liked', label: 'Most Liked' },
  { key: 'updated', label: 'Recently Updated' },
  { key: 'featured', label: 'Featured' },
];

export default function ExplorePage() {
  const [feed, setFeed] = useState('trending');
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExplore(feed);
  const playlists = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="text-muted-foreground">Discover public playlists from the community.</p>
      </div>

      <Tabs value={feed} onValueChange={setFeed}>
        <TabsList className="flex-wrap">
          {FEEDS.map((f) => (
            <TabsTrigger key={f.key} value={f.key}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <CardGridSkeleton count={12} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : playlists.length === 0 ? (
        <EmptyState title="No playlists here yet" description="Check back soon for fresh picks." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
