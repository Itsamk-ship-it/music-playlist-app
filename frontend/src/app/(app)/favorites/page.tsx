'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PlaylistCard, SongCard } from '@/components/cards';
import { CardGridSkeleton, EmptyState, ListSkeleton } from '@/components/states';
import { useFavoritePlaylists, useFavoriteSongs, useToggleFavorite } from '@/hooks/use-queries';

export default function FavoritesPage() {
  return (
    <AuthGuard>
      <Favorites />
    </AuthGuard>
  );
}

function Favorites() {
  const { data: songs, isLoading: loadingSongs } = useFavoriteSongs();
  const { data: playlists, isLoading: loadingPlaylists } = useFavoritePlaylists();
  const toggleFav = useToggleFavorite();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Favorites</h1>
        <p className="text-muted-foreground">Everything you&apos;ve saved in one place.</p>
      </div>

      <Tabs defaultValue="songs">
        <TabsList>
          <TabsTrigger value="songs">Songs</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>

        <TabsContent value="songs">
          {loadingSongs ? (
            <ListSkeleton />
          ) : songs?.length ? (
            <Card>
              <CardContent className="p-2">
                {songs.map((s, i) => (
                  <SongCard
                    key={s.id}
                    song={{ ...s, favoritedByViewer: true }}
                    index={i}
                    onFavorite={() => toggleFav.mutate({ target: 'SONG', id: s.id })}
                  />
                ))}
              </CardContent>
            </Card>
          ) : (
            <EmptyState title="No favorite songs" description="Tap the heart on any song to save it here." />
          )}
        </TabsContent>

        <TabsContent value="playlists">
          {loadingPlaylists ? (
            <CardGridSkeleton count={5} />
          ) : playlists?.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {playlists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="No saved playlists" description="Save playlists to find them here later." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
